import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { randomUUID } from "node:crypto";

import { transitionNeed } from "@/domain/need/state-machine";
import { DomainTransitionError } from "@/domain/shared/state-machine";
import {
  needDraftPayloadSchema,
  publishSchemaVersion,
} from "@/domain/publishing/contracts";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import {
  publishingV2ReadEnabled,
  publishingV2WriteEnabled,
} from "@/server/feature-flags/publishing-v2";

function requirePublishingV2Read() {
  if (!publishingV2ReadEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "FEATURE_NOT_AVAILABLE" });
  }
}

function requirePublishingV2Write() {
  if (!publishingV2WriteEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "FEATURE_NOT_AVAILABLE" });
  }
}

function minorAmount(value: bigint | null) {
  return value === null ? null : Number(value);
}

function numberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.filter((item): item is number => typeof item === "number");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is number => typeof item === "number")
      : [];
  } catch {
    return [];
  }
}

const ownerNeedInclude = {
  locationSnapshot: true,
  pets: {
    orderBy: { id: "asc" as const },
    include: {
      sourcePet: {
        select: {
          photos: {
            where: { status: 1 },
            orderBy: { order: "asc" as const },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  },
  tasks: {
    orderBy: { order: "asc" as const },
    include: { petLinks: { select: { petId: true } } },
  },
  homeVisitDetail: true,
  boardingDetail: true,
  dateExceptions: { orderBy: { date: "asc" as const } },
  visitWindows: { orderBy: { visitNumber: "asc" as const } },
  supplies: { orderBy: { id: "asc" as const } },
  requirements: { orderBy: { id: "asc" as const } },
  additionalCosts: { orderBy: { kind: "asc" as const } },
  attachments: {
    orderBy: { order: "asc" as const },
    include: {
      attachment: { select: { id: true, url: true, signature: true } },
    },
  },
} as const;

type OwnerNeed = Prisma.NeedV2GetPayload<{
  include: typeof ownerNeedInclude;
}>;

function toOwnerDto(need: OwnerNeed, now: Date) {
  return {
    ...need,
    minAmountMinor: minorAmount(need.minAmountMinor),
    maxAmountMinor: minorAmount(need.maxAmountMinor),
    expired: need.state === "OPEN" && new Date(need.endsAt) <= now,
    locationSnapshot: {
      ...need.locationSnapshot,
      lat: Number(need.locationSnapshot.lat),
      lon: Number(need.locationSnapshot.lon),
    },
    tasks: need.tasks.map((task) => ({
      ...task,
      visitNumbers: numberArray(task.visitNumbers),
      petIds: task.petLinks.map((link: { petId: string }) => link.petId),
      petLinks: undefined,
    })),
    pets: need.pets.map((pet) => ({
      ...pet,
      image: pet.sourcePet?.photos?.[0]?.url ?? null,
      sourcePet: undefined,
    })),
    additionalCosts: need.additionalCosts.map((cost) => ({
      ...cost,
      amountMinor: minorAmount(cost.amountMinor),
    })),
  };
}

function dateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toEditPayload(need: OwnerNeed) {
  const petKeys = new Map(
    need.pets.map((pet) => [pet.id, pet.clientPetKey]),
  );
  const tasks = need.tasks.map((task) => ({
    clientTaskKey: task.clientTaskKey,
    category: task.category,
    label: task.label,
    instructions: task.instructions,
    priority: task.priority,
    petKeys: task.petLinks.flatMap((link) => {
      const key = petKeys.get(link.petId);
      return key ? [key] : [];
    }),
    scheduleKind: task.scheduleKind,
    visitNumbers: numberArray(task.visitNumbers),
    order: task.order,
  }));
  const requirements = need.requirements.map((requirement) => ({
    kind: requirement.kind,
    label: requirement.label,
    petKey: requirement.petId ? petKeys.get(requirement.petId) ?? null : null,
  }));
  const payload = {
    title: need.title ?? undefined,
    description: need.description,
    startsAt: need.startsAt.toISOString(),
    endsAt: need.endsAt.toISOString(),
    timeZone: need.timeZone,
    pets: need.pets.map((pet) => ({
      clientPetKey: pet.clientPetKey,
      sourcePetId: pet.sourcePetId,
      quantity: pet.quantity,
      name: pet.name?.trim() ? pet.name.trim() : undefined,
      petType: pet.petType,
      breed: pet.breed,
      birthDate: dateOnly(pet.birthDate),
      weightGrams: pet.weightGrams,
      sex: pet.sex,
      neutered: pet.neutered,
      careNotes: pet.careNotes,
    })),
    location: {
      sourceLocationId: need.locationSnapshot.sourceLocationId ?? undefined,
      lat: Number(need.locationSnapshot.lat),
      lon: Number(need.locationSnapshot.lon),
      regionLabel: need.locationSnapshot.regionLabel,
      displayPrecision: need.locationSnapshot.displayPrecision,
    },
    budget: {
      kind: need.budgetKind,
      minAmountMinor: minorAmount(need.minAmountMinor),
      maxAmountMinor: minorAmount(need.maxAmountMinor),
      currency: need.currency,
      negotiable: need.negotiable,
    },
    additionalCosts: need.additionalCosts.map((cost) => ({
      kind: cost.kind,
      mode: cost.mode,
      amountMinor: minorAmount(cost.amountMinor),
    })),
    attachmentIds: need.attachments.map((item) => item.attachmentId),
    ...(need.mode === "HOME_VISIT" && need.homeVisitDetail
      ? {
          homeVisit: {
            intervalDays: need.homeVisitDetail.intervalDays,
            firstServiceDate: dateOnly(
              need.homeVisitDetail.firstServiceDate,
            ),
            excludedDates: need.dateExceptions.map((item) => dateOnly(item.date)),
            visitsPerServiceDay: need.homeVisitDetail.visitsPerServiceDay,
            visitWindows: need.visitWindows.map((window) => ({
              visitNumber: window.visitNumber,
              kind: window.kind,
              preferredLocalTime: window.preferredLocalTime,
            })),
            tasks,
          },
        }
      : {}),
    ...(need.mode === "BOARDING" && need.boardingDetail
      ? {
          boarding: {
            tasks,
            supplies: need.supplies.map((supply) => ({
              clientSupplyKey: supply.clientSupplyKey,
              petKey: supply.petId ? petKeys.get(supply.petId) ?? null : null,
              category: supply.category,
              label: supply.label,
              providedBy: supply.providedBy,
            })),
            requirements,
            transportMode: need.boardingDetail.transportMode,
            handoffDirection: need.boardingDetail.handoffDirection,
            maxProviderDistanceMeters:
              need.boardingDetail.maxProviderDistanceMeters,
            supplyNotes: need.boardingDetail.supplyNotes,
          },
        }
      : {}),
    ...(need.mode === "CUSTOM"
      ? {
          custom: {
            tasks,
            requirements,
            timePreference: need.customTimePreference ?? null,
            exactTime: need.customExactTime ?? null,
          },
        }
      : {}),
  };
  return needDraftPayloadSchema.parse(payload);
}

export const needV2Router = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    requirePublishingV2Read();
    const now = new Date();
    const needs = await ctx.prisma.needV2.findMany({
      where: { ownerId: ctx.session.user.id, archivedAt: null },
      include: ownerNeedInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return needs.map((need) => toOwnerDto(need, now));
  }),

  getMine: protectedProcedure
    .input(z.object({ id: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      requirePublishingV2Read();
      const need = await ctx.prisma.needV2.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
          archivedAt: null,
        },
        include: ownerNeedInclude,
      });
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      return toOwnerDto(need, new Date());
    }),

  beginEdit: protectedProcedure
    .input(z.object({ id: z.string().min(1) }).strict())
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const ownerId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const need = await tx.needV2.findFirst({
          where: {
            id: input.id,
            ownerId,
            archivedAt: null,
            state: { not: "CANCELLED" },
          },
          include: ownerNeedInclude,
        });
        if (!need) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        const existing = await tx.publishDraftV2.findFirst({
          where: {
            ownerId,
            kind: "NEED",
            editingNeedId: need.id,
            status: "ACTIVE",
          },
          orderBy: { updatedAt: "desc" },
        });
        if (existing) {
          return {
            ...existing,
            payload: JSON.parse(existing.payloadJson) as Record<string, unknown>,
            attachments: need.attachments.map((item) => item.attachment),
          };
        }
        const created = await tx.publishDraftV2.create({
          data: {
            id: randomUUID(),
            ownerId,
            kind: "NEED",
            mode: need.mode,
            schemaVersion: publishSchemaVersion,
            revision: 0,
            currentStep: "preview",
            payloadJson: JSON.stringify(toEditPayload(need)),
            status: "ACTIVE",
            editingNeedId: need.id,
          },
        });
        return {
          ...created,
          payload: JSON.parse(created.payloadJson) as Record<string, unknown>,
          attachments: need.attachments.map((item) => item.attachment),
        };
      });
    }),

  executeCommand: protectedProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          command: z.enum(["CLOSE", "REOPEN", "CANCEL"]),
          expectedUpdatedAt: z.coerce.date(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const ownerId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.needV2.findFirst({
          where: { id: input.id, ownerId, archivedAt: null },
          select: { id: true, state: true, endsAt: true, updatedAt: true },
        });
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        if (
          (input.command === "REOPEN" || input.command === "CLOSE") &&
          existing.state === "OPEN" &&
          new Date(existing.endsAt) <= new Date()
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "NEED_EXPIRED",
          });
        }
        if (input.command === "REOPEN" && new Date(existing.endsAt) <= new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "NEED_EXPIRED",
          });
        }
        let nextState;
        try {
          nextState = transitionNeed(existing.state, input.command);
        } catch (error) {
          if (error instanceof DomainTransitionError) {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.code,
              cause: error,
            });
          }
          throw error;
        }
        const updated = await tx.needV2.updateMany({
          where: {
            id: input.id,
            ownerId,
            archivedAt: null,
            state: existing.state,
            updatedAt: input.expectedUpdatedAt,
          },
          data: { state: nextState },
        });
        if (updated.count !== 1) {
          throw new TRPCError({ code: "CONFLICT", message: "CONFLICTING_UPDATE" });
        }
        return tx.needV2.findUniqueOrThrow({
          where: { id: input.id },
          select: { id: true, state: true, updatedAt: true },
        });
      });
    }),
});
