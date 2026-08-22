import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  needPublishSchema,
  publishDraftCreateSchema,
  publishDraftSaveSchema,
  publishSchemaVersion,
  servicePublishSchema,
} from "@/domain/publishing/contracts";
import { publishNeedV2Transaction } from "@/server/domains/publishing/publish-need-v2";
import { publishServiceV2Transaction } from "@/server/domains/publishing/publish-service-v2";
import { consumePostPublishEmailPrompt } from "@/server/domains/notification/email-preference";
import {
  profileDefaultsV2Enabled,
  publishingV2ReadEnabled,
  publishingV2WriteEnabled,
} from "@/server/feature-flags/publishing-v2";
import { protectedProcedure, router } from "@/server/trpc/trpc";

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

function serializePayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

function toDraftDto<T extends { payloadJson: string }>(draft: T) {
  const { payloadJson, ...metadata } = draft;
  return { ...metadata, payload: JSON.parse(payloadJson) as Record<string, unknown> };
}

export const publishDraftRouter = router({
  publishService: protectedProcedure
    .input(servicePublishSchema)
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const ownerId = ctx.session.user.id;
      const now = new Date();
      let result;
      try {
        result = await ctx.prisma.$transaction(
          (tx) => publishServiceV2Transaction(tx, ownerId, input, now, { saveProfileDefaults: profileDefaultsV2Enabled() }),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== "P2002"
        ) {
          throw error;
        }
        const existing = await ctx.prisma.serviceV2.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: {
            id: true,
            serviceProfile: { select: { userId: true } },
            sourceDraft: { select: { id: true } },
          },
        });
        if (
          !existing ||
          existing.serviceProfile.userId !== ownerId ||
          existing.sourceDraft?.id !== input.draftId
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "IDEMPOTENCY_KEY_REUSED",
          });
        }
        result = { serviceId: existing.id, replayed: true, edited: false };
      }
      const notificationPrompt = await consumePostPublishEmailPrompt(ctx.prisma, ownerId, now);
      return {
        ...result,
        state: "ACTIVE" as const,
        recommendation: { status: "DEFERRED" as const },
        notificationPrompt,
      };
    }),
  publishNeed: protectedProcedure
    .input(needPublishSchema)
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const ownerId = ctx.session.user.id;
      const now = new Date();
      let result;
      try {
        result = await ctx.prisma.$transaction(
          (tx) => publishNeedV2Transaction(tx, ownerId, input, now),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 10_000,
            timeout: 30_000,
          },
        );
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== "P2002"
        ) {
          throw error;
        }
        const existing = await ctx.prisma.needV2.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: {
            id: true,
            ownerId: true,
            sourceDraft: { select: { id: true } },
          },
        });
        if (
          !existing ||
          existing.ownerId !== ownerId ||
          existing.sourceDraft?.id !== input.draftId
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "IDEMPOTENCY_KEY_REUSED",
          });
        }
        result = { needId: existing.id, replayed: true, edited: false };
      }
      const notificationPrompt = await consumePostPublishEmailPrompt(ctx.prisma, ownerId, now);
      return {
        ...result,
        state: "OPEN" as const,
        recommendation: { status: "DEFERRED" as const },
        notificationPrompt,
      };
    }),
  create: protectedProcedure
    .input(publishDraftCreateSchema)
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const userId = ctx.session.user.id;
      const existing = await ctx.prisma.publishDraftV2.findUnique({
        where: { id: input.id },
      });
      if (existing) {
        if (existing.ownerId !== userId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        if (existing.kind !== input.kind) {
          throw new TRPCError({ code: "CONFLICT", message: "IDEMPOTENCY_KEY_REUSED" });
        }
        return toDraftDto(existing);
      }
      const created = await ctx.prisma.publishDraftV2.create({
        data: {
          id: input.id,
          ownerId: userId,
          kind: input.kind,
          mode: input.mode,
          schemaVersion: publishSchemaVersion,
          revision: 0,
          currentStep: input.currentStep,
          payloadJson: serializePayload(input.payload),
          status: "ACTIVE",
        },
      });
      return toDraftDto(created);
    }),

  save: protectedProcedure
    .input(publishDraftSaveSchema)
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const userId = ctx.session.user.id;
      const owned = await ctx.prisma.publishDraftV2.findFirst({
        where: { id: input.id, ownerId: userId },
        select: { id: true, kind: true },
      });
      if (!owned) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      if (owned.kind !== input.kind) {
        throw new TRPCError({ code: "CONFLICT", message: "DRAFT_KIND_MISMATCH" });
      }
      const updated = await ctx.prisma.publishDraftV2.updateMany({
        where: {
          id: input.id,
          ownerId: userId,
          status: "ACTIVE",
          schemaVersion: publishSchemaVersion,
          revision: input.expectedRevision,
        },
        data: {
          mode: input.mode,
          currentStep: input.currentStep,
          payloadJson: serializePayload(input.payload),
          lastValidatedAt: new Date(),
          revision: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new TRPCError({ code: "CONFLICT", message: "DRAFT_REVISION_CONFLICT" });
      }
      const saved = await ctx.prisma.publishDraftV2.findUniqueOrThrow({
        where: { id: input.id },
      });
      return toDraftDto(saved);
    }),

  getMine: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .query(async ({ ctx, input }) => {
      requirePublishingV2Read();
      const draft = await ctx.prisma.publishDraftV2.findFirst({
        where: { id: input.id, ownerId: ctx.session.user.id },
      });
      if (!draft) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      return toDraftDto(draft);
    }),

  listMine: protectedProcedure
    .input(
      z
        .object({
          kind: z.enum(["NEED", "SERVICE"]).optional(),
          includeAbandoned: z.boolean().default(false),
        })
        .strict()
        .default({ includeAbandoned: false }),
    )
    .query(async ({ ctx, input }) => {
      requirePublishingV2Read();
      const drafts = await ctx.prisma.publishDraftV2.findMany({
        where: {
          ownerId: ctx.session.user.id,
          kind: input.kind,
          status: input.includeAbandoned ? undefined : { not: "ABANDONED" },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      });
      return drafts.map(toDraftDto);
    }),

  abandon: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      requirePublishingV2Write();
      const userId = ctx.session.user.id;
      const draft = await ctx.prisma.publishDraftV2.findFirst({
        where: { id: input.id, ownerId: userId },
        select: { status: true },
      });
      if (!draft) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      if (draft.status === "PUBLISHED") {
        throw new TRPCError({ code: "CONFLICT", message: "PUBLISHED_DRAFT_IMMUTABLE" });
      }
      if (draft.status === "ABANDONED") {
        const abandoned = await ctx.prisma.publishDraftV2.findUniqueOrThrow({ where: { id: input.id } });
        return toDraftDto(abandoned);
      }
      const abandoned = await ctx.prisma.publishDraftV2.update({
        where: { id: input.id },
        data: { status: "ABANDONED" },
      });
      return toDraftDto(abandoned);
    }),
});
