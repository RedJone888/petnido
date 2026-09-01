import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { clientMessageIdSchema, conversationContextTargetSchema, messageBodySchema } from "@/domain/messaging/conversation";
import {
  acceptNeedApplication,
  ApplicationCommandError,
  cancelNeedApplication,
  createNeedApplication,
  declineNeedApplication,
} from "@/server/domains/application/need-application-v2";
import { protectedProcedure, router } from "@/server/trpc/trpc";

function commandError(error: unknown): never {
  if (error instanceof ApplicationCommandError) {
    const code = error.code === "RESOURCE_NOT_FOUND"
      ? "NOT_FOUND"
      : error.code === "FORBIDDEN_RESOURCE_ACTION"
        ? "FORBIDDEN"
        : "CONFLICT";
    throw new TRPCError({ code, message: error.code, cause: error });
  }
  throw error;
}

const applicationIdInput = z.object({ applicationId: z.string().min(1).max(128) }).strict();

export const needApplicationRouter = router({
  create: protectedProcedure
    .input(z.object({
      target: z.object({ kind: z.literal("NEED"), publicId: z.string().min(1).max(128) }).strict(),
      body: messageBodySchema,
      idempotencyKey: clientMessageIdSchema,
    }).strict())
    .mutation(async ({ ctx, input }) => {
      try {
        return await createNeedApplication(ctx.prisma, {
          actorId: ctx.session.user.id,
          target: conversationContextTargetSchema.parse(input.target),
          body: input.body,
          idempotencyKey: input.idempotencyKey,
        });
      } catch (error) {
        commandError(error);
      }
    }),

  accept: protectedProcedure.input(applicationIdInput).mutation(async ({ ctx, input }) => {
    try {
      return await acceptNeedApplication(ctx.prisma, { ownerId: ctx.session.user.id, applicationId: input.applicationId });
    } catch (error) {
      commandError(error);
    }
  }),

  decline: protectedProcedure.input(applicationIdInput).mutation(async ({ ctx, input }) => {
    try {
      return await declineNeedApplication(ctx.prisma, { ownerId: ctx.session.user.id, applicationId: input.applicationId });
    } catch (error) {
      commandError(error);
    }
  }),

  cancel: protectedProcedure.input(applicationIdInput).mutation(async ({ ctx, input }) => {
    try {
      return await cancelNeedApplication(ctx.prisma, { actorId: ctx.session.user.id, applicationId: input.applicationId });
    } catch (error) {
      commandError(error);
    }
  }),

  stateForNeed: protectedProcedure
    .input(z.object({ publicId: z.string().min(1).max(128) }).strict())
    .query(async ({ ctx, input }) => {
      const target = conversationContextTargetSchema.parse({ kind: "NEED", publicId: input.publicId });
      const application = await ctx.prisma.needApplicationV2.findUnique({
        where: { needSource_needId_applicantId: { needSource: target.source, needId: target.contextId, applicantId: ctx.session.user.id } },
        select: { id: true, state: true, conversationId: true, createdAt: true },
      });
      return application;
    }),

  listSubmitted: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.needApplicationV2.findMany({
      where: { applicantId: ctx.session.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, state: true, needSource: true, needId: true, needTitleSnapshot: true, needModeSnapshot: true,
        conversationId: true, createdAt: true, updatedAt: true,
        owner: { select: { id: true, name: true, image: true } },
      },
    });
  }),

  listReceived: protectedProcedure.query(async ({ ctx }) => {
    const applications = await ctx.prisma.needApplicationV2.findMany({
      where: { ownerId: ctx.session.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, state: true, needSource: true, needId: true, needTitleSnapshot: true, needModeSnapshot: true,
        conversationId: true, createdAt: true, updatedAt: true,
        applicant: {
          select: {
            id: true, name: true, image: true, createdAt: true,
            serviceProfile: {
              select: {
                id: true, introduction: true, monthsExperience: true, rating: true, reviewCount: true, isAccepting: true,
                servicesV2: { where: { state: "ACTIVE", archivedAt: null }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, title: true, mode: true } },
              },
            },
          },
        },
      },
    });
    return applications.map((application) => {
      const profile = application.applicant.serviceProfile;
      return {
        ...application,
        applicant: {
          ...application.applicant,
          serviceProfile: profile
            ? { ...profile, activeServiceCount: profile.servicesV2.length }
            : null,
        },
      };
    });
  }),
});
