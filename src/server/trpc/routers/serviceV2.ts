import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { publishSchemaVersion } from "@/domain/publishing/contracts";
import {
  ownerServiceV2Include,
  toOwnerServiceV2Dto,
  toServiceV2EditPayload,
} from "@/domain/service/v2-dto";
import { transitionService } from "@/domain/service/state-machine";
import { DomainTransitionError } from "@/domain/shared/state-machine";
import { protectedProcedure, router } from "@/server/trpc/trpc";

async function ownedService(
  prisma: Prisma.TransactionClient | PrismaClient,
  id: string,
  ownerId: string,
) {
  const service = await prisma.serviceV2.findFirst({
    where: {
      id,
      archivedAt: null,
      serviceProfile: { userId: ownerId },
    },
    include: ownerServiceV2Include,
  });
  if (!service) {
    throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
  }
  return service;
}

export const serviceV2Router = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const services = await ctx.prisma.serviceV2.findMany({
      where: {
        archivedAt: null,
        serviceProfile: { userId: ctx.session.user.id },
      },
      include: ownerServiceV2Include,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return services.map(toOwnerServiceV2Dto);
  }),

  getMine: protectedProcedure
    .input(z.object({ id: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      return toOwnerServiceV2Dto(await ownedService(ctx.prisma, input.id, ctx.session.user.id));
    }),

  beginEdit: protectedProcedure
    .input(z.object({ id: z.string().min(1) }).strict())
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const service = await ownedService(tx, input.id, ownerId);
        const existing = await tx.publishDraftV2.findFirst({
          where: {
            ownerId,
            kind: "SERVICE",
            editingServiceId: service.id,
            status: "ACTIVE",
          },
          orderBy: { updatedAt: "desc" },
        });
        if (existing) {
          return {
            ...existing,
            payload: JSON.parse(existing.payloadJson) as Record<string, unknown>,
            attachments: service.attachments.map((item) => item.attachment),
          };
        }
        const created = await tx.publishDraftV2.create({
          data: {
            id: randomUUID(),
            ownerId,
            kind: "SERVICE",
            mode: service.mode,
            schemaVersion: publishSchemaVersion,
            revision: 0,
            currentStep: "review",
            payloadJson: JSON.stringify(toServiceV2EditPayload(service)),
            status: "ACTIVE",
            editingServiceId: service.id,
          },
        });
        return {
          ...created,
          payload: JSON.parse(created.payloadJson) as Record<string, unknown>,
          attachments: service.attachments.map((item) => item.attachment),
        };
      });
    }),

  getEditDraft: protectedProcedure
    .input(z.object({ draftId: z.string().uuid() }).strict())
    .query(async ({ ctx, input }) => {
      const draft = await ctx.prisma.publishDraftV2.findFirst({
        where: {
          id: input.draftId,
          ownerId: ctx.session.user.id,
          kind: "SERVICE",
          status: "ACTIVE",
          editingServiceId: { not: null },
        },
      });
      if (!draft?.editingServiceId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      const service = await ownedService(ctx.prisma, draft.editingServiceId, ctx.session.user.id);
      return {
        ...draft,
        payload: JSON.parse(draft.payloadJson) as Record<string, unknown>,
        attachments: service.attachments.map((item) => item.attachment),
      };
    }),

  executeCommand: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        command: z.enum(["PAUSE", "RESUME", "ARCHIVE"]),
        expectedUpdatedAt: z.coerce.date(),
      }).strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const ownerId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.serviceV2.findFirst({
          where: {
            id: input.id,
            archivedAt: null,
            serviceProfile: { userId: ownerId },
          },
          select: { id: true, state: true, updatedAt: true },
        });
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        let nextState;
        try {
          nextState = transitionService(existing.state, input.command);
        } catch (error) {
          if (error instanceof DomainTransitionError) {
            throw new TRPCError({ code: "CONFLICT", message: error.code, cause: error });
          }
          throw error;
        }
        const updated = await tx.serviceV2.updateMany({
          where: {
            id: input.id,
            state: existing.state,
            updatedAt: input.expectedUpdatedAt,
            archivedAt: null,
            serviceProfile: { userId: ownerId },
          },
          data: {
            state: nextState,
            archivedAt: nextState === "ARCHIVED" ? new Date() : null,
          },
        });
        if (updated.count !== 1) {
          throw new TRPCError({ code: "CONFLICT", message: "CONFLICTING_UPDATE" });
        }
        return tx.serviceV2.findUniqueOrThrow({
          where: { id: input.id },
          select: { id: true, state: true, updatedAt: true },
        });
      });
    }),
});
