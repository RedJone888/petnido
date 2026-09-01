import { TRPCError } from "@trpc/server";

import {
  onboardingIntentInputSchema,
  onboardingProfileSchema,
  preferredLocaleUpdateSchema,
  preferredCurrencyUpdateSchema,
  profileUpdateSchema,
  avatarAttachmentSchema,
} from "@/lib/zod/profile";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const mineSelect = {
  id: true,
  email: true,
  emailVerified: true,
  name: true,
  image: true,
  avatarAttachmentId: true,
  profile: {
    select: {
      bio: true,
      isOwner: true,
      isSitter: true,
      onboardingStep: true,
      initialIntent: true,
      preferredLocale: true,
      timeZone: true,
    },
  },
} as const;

export const profileRouter = router({
  getMine: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: mineSelect,
    }),
  ),

  getPreferredCurrency: protectedProcedure.query(async ({ ctx }) => {
    try {
      const profile = await ctx.prisma.profile.findUniqueOrThrow({
        where: { userId: ctx.session.user.id },
        select: { preferredCurrency: true },
      });
      return profile.preferredCurrency;
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "";
      if (code === "P2022") return "JPY" as const;
      throw error;
    }
  }),

  listUsedCurrencies: protectedProcedure.query(async ({ ctx }) => {
    const [needs, services] = await Promise.all([
      ctx.prisma.needV2.findMany({ where: { ownerId: ctx.session.user.id }, distinct: ["currency"], select: { currency: true } }),
      ctx.prisma.serviceV2.findMany({ where: { serviceProfile: { userId: ctx.session.user.id } }, distinct: ["currency"], select: { currency: true } }),
    ]);
    return [...new Set([
      ...needs.map((item) => item.currency),
      ...services.map((item) => item.currency),
    ])];
  }),

  setPreferredLocale: protectedProcedure
    .input(preferredLocaleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.profile.updateMany({
        where: { userId: ctx.session.user.id },
        data: { preferredLocale: input.preferredLocale },
      });
      if (result.count !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
      return { preferredLocale: input.preferredLocale };
    }),

  setPreferredCurrency: protectedProcedure
    .input(preferredCurrencyUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.profile.updateMany({
        where: { userId: ctx.session.user.id },
        data: { preferredCurrency: input.preferredCurrency },
      });
      if (result.count !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
      return { preferredCurrency: input.preferredCurrency };
    }),

  updateMine: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({
          where: { id: userId },
          select: { image: true, avatarAttachmentId: true },
        });
        if (!current) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        const clearOwnedAvatar =
          Boolean(current.avatarAttachmentId) && input.avatarUrl !== current.image;
        if (clearOwnedAvatar && current.avatarAttachmentId) {
          await tx.attachment.updateMany({
            where: { id: current.avatarAttachmentId, userId },
            data: { status: 2 },
          });
        }
        const user = await tx.user.updateMany({
          where: { id: userId },
          data: {
            name: input.nickname,
            image: input.avatarUrl,
            ...(clearOwnedAvatar ? { avatarAttachmentId: null } : {}),
          },
        });
        const profile = await tx.profile.updateMany({
          where: { userId },
          data: {
            bio: input.bio,
            preferredLocale: input.preferredLocale,
            timeZone: input.timeZone,
          },
        });
        if (user.count !== 1 || profile.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        return tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: mineSelect,
        });
      });
    }),

  setAvatarAttachment: protectedProcedure
    .input(avatarAttachmentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { avatarAttachmentId: true },
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        const attachment = await tx.attachment.findFirst({
          where: {
            id: input.attachmentId,
            userId,
            OR: [
              { status: 0 },
              ...(user.avatarAttachmentId === input.attachmentId
                ? [{ status: 1 }]
                : []),
            ],
          },
          select: { id: true, url: true },
        });
        if (!attachment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        if (
          user.avatarAttachmentId &&
          user.avatarAttachmentId !== attachment.id
        ) {
          await tx.attachment.updateMany({
            where: { id: user.avatarAttachmentId, userId },
            data: { status: 2 },
          });
        }
        await tx.attachment.update({
          where: { id: attachment.id },
          data: { status: 1 },
        });
        return tx.user.update({
          where: { id: userId },
          data: {
            image: attachment.url,
            avatarAttachmentId: attachment.id,
          },
          select: mineSelect,
        });
      });
    }),

  removeAvatar: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { avatarAttachmentId: true },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
      if (user.avatarAttachmentId) {
        await tx.attachment.updateMany({
          where: { id: user.avatarAttachmentId, userId },
          data: { status: 2 },
        });
      }
      return tx.user.update({
        where: { id: userId },
        data: { image: null, avatarAttachmentId: null },
        select: mineSelect,
      });
    });
  }),

  completeOnboardingProfile: protectedProcedure
    .input(onboardingProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const profile = await tx.profile.updateMany({
          where: { userId, onboardingStep: "PROFILE" },
          data: {
            preferredLocale: input.preferredLocale,
            timeZone: input.timeZone,
            ...(input.initialIntent
              ? { initialIntent: input.initialIntent, onboardingStep: "COMPLETE" }
              : { onboardingStep: "INTENT" }),
          },
        });
        if (profile.count !== 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CONFLICTING_UPDATE",
          });
        }
        await tx.user.update({
          where: { id: userId },
          data: { name: input.nickname, image: input.avatarUrl },
        });
        return {
          nextStep: input.initialIntent ? ("COMPLETE" as const) : ("INTENT" as const),
        };
      });
    }),

  chooseInitialIntent: protectedProcedure
    .input(onboardingIntentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const nextStep =
        input.intent === "OFFER_SERVICE" ? "PROVIDER_PROFILE" : "COMPLETE";
      const updated = await ctx.prisma.profile.updateMany({
        where: { userId, onboardingStep: "INTENT" },
        data: { initialIntent: input.intent, onboardingStep: nextStep },
      });
      if (updated.count !== 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "CONFLICTING_UPDATE",
        });
      }
      return { nextStep };
    }),
});
