import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  canEditPublishedNeed,
  canReusePublishedNeed,
  transitionNeed,
} from "@/domain/need/state-machine";
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
import { buildNeedDisplayTitle } from "@/modules/need-publishing/domain/display-title";
import { normalizeTaskIdentity } from "@/modules/need-publishing/domain/task-catalog";

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
    include: {
      petLinks: { select: { petId: true } },
      visitOrders: {
        orderBy: { visitNumber: "asc" as const },
      },
    },
  },
  homeVisitDetail: true,
  boardingDetail: true,
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
    // Titles are derived at read time. The dashboard currently receives an
    // English fallback; locale-aware clients can derive the same value from
    // mode + pets without persisting localized text.
    title: buildNeedDisplayTitle({ mode: need.mode, pets: need.pets }),
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
      ...canonicalTaskReadFields(task),
      visitNumbers: numberArray(task.visitNumbers),
      orderByVisit: Object.fromEntries(
        task.visitOrders.map((visitOrder) => [
          visitOrder.visitNumber,
          visitOrder.order,
        ]),
      ),
      petIds: task.petLinks.map((link: { petId: string }) => link.petId),
      petLinks: undefined,
      visitOrders: undefined,
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

function parseDraftPayload(payloadJson: string) {
  return JSON.parse(payloadJson) as Record<string, unknown>;
}

function canonicalTaskReadFields(task: {
  category?: string | null;
  label?: string | null;
}) {
  const category = task.category ?? "";
  const upperCategory = category.toUpperCase();
  const custom = upperCategory === "CUSTOM" || upperCategory.startsWith("CUSTOM-");
  const identity = normalizeTaskIdentity({
    category,
    label: task.label,
    custom,
  });
  return {
    // Keep an unknown legacy category when its label is not a catalog label;
    // this preserves user text while still canonicalizing known standard rows.
    category: identity.custom
      ? custom
        ? "CUSTOM"
        : category
      : identity.code.toUpperCase(),
    label: identity.label,
  };
}

function toEditPayload(need: OwnerNeed) {
  const petKeys = new Map(
    need.pets.map((pet) => [pet.id, pet.clientPetKey]),
  );
  const tasks = need.tasks.map((task) => ({
    clientTaskKey: task.clientTaskKey,
    ...canonicalTaskReadFields(task),
    instructions: task.instructions,
    priority: task.priority,
    petKeys: task.petLinks.flatMap((link) => {
      const key = petKeys.get(link.petId);
      return key ? [key] : [];
    }),
    scheduleKind: task.scheduleKind,
    visitNumbers: numberArray(task.visitNumbers),
    // HOME_VISIT rows intentionally have no global order now that ordering is
    // stored per visit. Omit the nullable database value from the draft shape;
    // the client uses orderByVisit and its local fallback when needed.
    ...(task.order === null ? {} : { order: task.order }),
    ...(task.visitOrders.length
      ? {
          orderByVisit: Object.fromEntries(
            task.visitOrders.map((visitOrder) => [
              visitOrder.visitNumber,
              visitOrder.order,
            ]),
          ),
        }
      : {}),
  }));
  const requirements = need.requirements.map((requirement) => ({
    kind: requirement.kind,
    label: requirement.label,
    petKey: requirement.petId ? petKeys.get(requirement.petId) ?? null : null,
  }));
  const payload = {
    description: need.description,
    scheduleNotes: need.scheduleNotes,
    startsAt: need.startsAt.toISOString(),
    endsAt: need.endsAt.toISOString(),
    timeZone: need.timeZone,
    pets: need.pets.map((pet) => ({
      clientPetKey: pet.clientPetKey,
      sourcePetId: pet.sourcePetId,
      quantity: pet.quantity,
      name: pet.name?.trim() ? pet.name.trim() : undefined,
      petType: pet.petType,
      customPetType: pet.customPetType,
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

/**
 * Reuse is a new request, not an edit. Keep stable context such as pets,
 * tasks, location and budget, but clear dates and date-specific preferences
 * so an old request cannot accidentally be published with stale availability.
 */
function toReusePayload(need: OwnerNeed) {
  const payload = toEditPayload(need);
  return needDraftPayloadSchema.parse({
    ...payload,
    // Care type comes from the source Need and is already confirmed. Pets
    // remain the first interactive step so the owner can refresh the snapshot
    // before dates and other time-sensitive data are entered.
    workspace: {
      version: 1,
      common: { confirmedScreenIds: ["care"] },
      draftByMode: {},
    },
    startsAt: null,
    endsAt: null,
    scheduleNotes: null,
    ...(payload.homeVisit
      ? {
          homeVisit: {
            ...payload.homeVisit,
            firstServiceDate: null,
            visitWindows: [],
          },
        }
      : {}),
    ...(payload.custom
      ? {
          custom: {
            ...payload.custom,
            timePreference: null,
            exactTime: null,
          },
        }
      : {}),
  });
}

export const needPublishingRouter = router({
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
          },
          include: ownerNeedInclude,
        });
        if (!need) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        if (!canEditPublishedNeed(need.state)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "NEED_MATCHED_EDIT_REQUIRES_CANCEL_MATCH",
          });
        }
        const existing = await tx.publishDraftV2.findFirst({
          where: {
            ownerId,
            kind: "NEED",
            editingNeedId: need.id,
            status: "ACTIVE",
            isDirty: true,
          },
          orderBy: { updatedAt: "desc" },
        });
        if (existing) {
          return {
            ...existing,
            isExisting: true,
            payload: parseDraftPayload(existing.payloadJson),
            attachments: need.attachments.map((item) => item.attachment),
          };
        }
        return {
          id: null,
          ownerId,
          kind: "NEED" as const,
          mode: need.mode,
          schemaVersion: publishSchemaVersion,
          revision: 0,
          currentStep: "preview",
          status: "ACTIVE" as const,
          publishedNeedId: null,
          editingNeedId: need.id,
          editingBaselineJson: JSON.stringify(toEditPayload(need)),
          isDirty: false,
          isExisting: false,
          payload: toEditPayload(need),
          attachments: need.attachments.map((item) => item.attachment),
        };
      });
    }),

  /**
   * Lazily create the server-side edit draft after the owner actually changes
   * something (or explicitly publishes from the baseline Preview). Opening
   * Edit alone therefore never creates a misleading "one minute ago" draft.
   */
  createEditDraft: protectedProcedure
    .input(
      z
        .object({
          id: z.string().uuid(),
          needId: z.string().min(1),
          mode: z.enum(["HOME_VISIT", "BOARDING", "CUSTOM"]),
          currentStep: z.string().min(1).max(80),
          payload: needDraftPayloadSchema,
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const ownerId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const need = await tx.needV2.findFirst({
          where: {
            id: input.needId,
            ownerId,
            archivedAt: null,
          },
          include: ownerNeedInclude,
        });
        if (!need) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        if (!canEditPublishedNeed(need.state)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "NEED_MATCHED_EDIT_REQUIRES_CANCEL_MATCH",
          });
        }
        if (need.mode !== input.mode) {
          throw new TRPCError({ code: "CONFLICT", message: "DRAFT_MODE_MISMATCH" });
        }

        const existing = await tx.publishDraftV2.findFirst({
          where: {
            ownerId,
            kind: "NEED",
            editingNeedId: need.id,
            status: "ACTIVE",
            isDirty: true,
          },
          orderBy: { updatedAt: "desc" },
        });
        if (existing) {
          return {
            ...existing,
            payload: parseDraftPayload(existing.payloadJson),
            attachments: need.attachments.map((item) => item.attachment),
          };
        }

        const sameId = await tx.publishDraftV2.findUnique({
          where: { id: input.id },
          select: { ownerId: true },
        });
        if (sameId) {
          if (sameId.ownerId !== ownerId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
          }
          throw new TRPCError({ code: "CONFLICT", message: "DRAFT_ID_REUSED" });
        }

        const baseline = toEditPayload(need);
        const created = await tx.publishDraftV2.create({
          data: {
            id: input.id,
            ownerId,
            kind: "NEED",
            mode: need.mode,
            schemaVersion: publishSchemaVersion,
            revision: 0,
            currentStep: input.currentStep,
            payloadJson: JSON.stringify(input.payload),
            status: "ACTIVE",
            editingNeedId: need.id,
            editingBaselineJson: JSON.stringify(baseline),
            isDirty: true,
          },
        });
        return {
          ...created,
          payload: parseDraftPayload(created.payloadJson),
          attachments: need.attachments.map((item) => item.attachment),
        };
      });
    }),

  executeCommand: protectedProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          command: z.enum(["CLOSE", "REOPEN", "ARCHIVE", "CANCEL_MATCH", "CANCEL"]),
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

        // Deleting a request is an archive operation. archivedAt is the
        // visibility boundary; NeedV2 has no cancellation state.
        if (input.command === "ARCHIVE" || input.command === "CANCEL") {
          const archived = await tx.needV2.updateMany({
            where: {
              id: input.id,
              ownerId,
              archivedAt: null,
              updatedAt: input.expectedUpdatedAt,
            },
            data: { archivedAt: new Date() },
          });
          if (archived.count !== 1) {
            throw new TRPCError({ code: "CONFLICT", message: "CONFLICTING_UPDATE" });
          }
          return tx.needV2.findUniqueOrThrow({
            where: { id: input.id },
            select: { id: true, state: true, archivedAt: true, updatedAt: true },
          });
        }

        if (input.command === "CANCEL_MATCH" && existing.state !== "MATCHED") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "NEED_IS_NOT_MATCHED",
          });
        }
        // An expired OPEN request can still be explicitly closed. Only
        // reopening requires a future end date; otherwise an owner cannot
        // clear an already-expired request from the active state safely.
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

  /**
   * Start a new request from an owner's published request. This is not an
   * edit: it receives a fresh draft/idempotency key and has no editingNeedId,
   * so publishing it cannot mutate the source request.
   */
  reuse: protectedProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          draftId: z.string().uuid(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const ownerId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const need = await tx.needV2.findFirst({
          where: { id: input.id, ownerId, archivedAt: null },
          include: ownerNeedInclude,
        });
        if (!need || !canReusePublishedNeed(need.state)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        const payload = toReusePayload(need);
        // The client may retry after a connection closes after commit. The
        // caller-provided id makes that retry return the same clone instead
        // of creating a duplicate or surfacing a misleading conflict.
        const created = await tx.publishDraftV2.upsert({
          where: { id: input.draftId },
          create: {
            id: input.draftId,
            ownerId,
            kind: "NEED",
            mode: need.mode,
            schemaVersion: publishSchemaVersion,
            revision: 0,
            // Reuse starts after care type, at Pets, so current pet details
            // are explicitly reconfirmed before dates and care plan.
            currentStep: "pets",
            payloadJson: JSON.stringify(payload),
            status: "ACTIVE",
            clonedFromNeedId: need.id,
          },
          update: {},
        });
        if (
          created.ownerId !== ownerId ||
          created.kind !== "NEED" ||
          created.clonedFromNeedId !== need.id ||
          created.editingNeedId
        ) {
          throw new TRPCError({ code: "CONFLICT", message: "DRAFT_ID_REUSED" });
        }
        return {
          ...created,
          payload: parseDraftPayload(created.payloadJson),
          sourceNeedId: need.id,
        };
      });
    }),
});
