import { router, protectedProcedure } from "@/server/trpc/trpc";
import {
  baseInfoSchema,
  onboardingProviderProfileSchema,
} from "@/lib/zod/serviceProfile";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { requireOwnedServiceProfile } from "@/server/domains/resource-ownership";

export const serviceProfileRouter = router({
  completeOnboarding: protectedProcedure
    .input(onboardingProviderProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const advanced = await tx.profile.updateMany({
          where: { userId, onboardingStep: "PROVIDER_PROFILE" },
          data: { onboardingStep: "COMPLETE", isSitter: true },
        });
        if (advanced.count !== 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CONFLICTING_UPDATE",
          });
        }
        await tx.serviceProfile.upsert({
          where: { userId },
          update: input,
          create: { userId, ...input },
        });
        return { nextStep: "COMPLETE" as const };
      });
    }),
  // 当前用户的 profile + services 一起取回
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id;
    const [profile, serviceProfile] = await Promise.all([
      ctx.prisma.profile.findUnique({ where: { userId } }),
      ctx.prisma.serviceProfile.findUnique({
        where: { userId },
        include: {
          services: {
            where: { archivedAt: null },
            include: {
              priceRules: true,
              photos: {
                where: { status: 1 },
                orderBy: {
                  order: "asc",
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
    ]);
    if (!profile) {
      throw new Error("プロフィール情報が見つかりません。NOT_FOUND");
    }
    return { profile, serviceProfile };
  }),
  getLocationAndCurrency: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id;
    const serviceProfile = await ctx.prisma.serviceProfile.findUnique({
      where: { userId },
      select: {
        baseAreaRaw: true,
        baseLat: true,
        baseLon: true,
        baseCurrency: true,
      },
    });

    // if (!serviceProfile) {
    //   throw new Error({ code: "NOT_FOUND", message: "ServiceProfileが存在しません" });
    // }
    return serviceProfile;
  }),
  toggleSitterStatus: protectedProcedure
    .input(z.object({ active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user?.id!;
      // 1. isSitter = true
      return await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.profile.updateMany({
          where: { userId },
          data: { isSitter: input.active },
        });
        if (updated.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        if (input.active) {
          await tx.serviceProfile.upsert({
            where: { userId },
            update: {},
            create: { userId },
          });
        }
        return tx.profile.findUniqueOrThrow({ where: { userId } });
      });
    }),
  updateInfo: protectedProcedure
    .input(baseInfoSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      await requireOwnedServiceProfile(ctx.prisma, userId);
      const profile = await ctx.prisma.serviceProfile.update({
        where: { userId },
        data: {
          baseAreaRaw: input.baseAreaRaw,
          baseLat: input.baseLat,
          baseLon: input.baseLon,
          baseCurrency: input.baseCurrency,
          introduction: input.introduction,
          monthsExperience: input.monthsExperience,
        },
      });

      return profile;
    }),
});
