import { TRPCError } from "@trpc/server";

import {
  onboardingIntentInputSchema,
  onboardingProfileSchema,
  profileUpdateSchema,
} from "@/lib/zod/profile";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const mineSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
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

  updateMine: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.updateMany({
          where: { id: userId },
          data: { name: input.nickname, image: input.avatarUrl },
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
            onboardingStep: "INTENT",
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
        return { nextStep: "INTENT" as const };
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
