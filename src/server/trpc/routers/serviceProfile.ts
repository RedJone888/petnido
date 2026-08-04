import { router, protectedProcedure } from "@/server/trpc/trpc";
import {
  acceptingStatusSchema,
  onboardingProviderProfileSchema,
  serviceProfileSettingsSchema,
} from "@/lib/zod/serviceProfile";
import { TRPCError } from "@trpc/server";

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
          update: { ...input, isAccepting: true },
          create: { userId, ...input, isAccepting: true },
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
          defaultLocation: {
            select: {
              id: true,
              label: true,
              regionLabel: true,
              displayPrecision: true,
              lat: true,
              lon: true,
            },
          },
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
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [profile, serviceProfile] = await Promise.all([
      ctx.prisma.profile.findUnique({
        where: { userId },
        select: { isSitter: true },
      }),
      ctx.prisma.serviceProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          introduction: true,
          monthsExperience: true,
          baseCurrency: true,
          defaultLocationId: true,
          isAccepting: true,
        },
      }),
    ]);
    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "RESOURCE_NOT_FOUND",
      });
    }
    return { isProvider: profile.isSitter, serviceProfile };
  }),
  enableOffering: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.updateMany({
        where: { userId, onboardingStep: "COMPLETE" },
        data: { isSitter: true },
      });
      if (profile.count !== 1) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "CONFLICTING_UPDATE",
        });
      }
      return tx.serviceProfile.upsert({
        where: { userId },
        update: { isAccepting: true },
        create: { userId, isAccepting: true },
        select: { id: true, isAccepting: true },
      });
    });
  }),
  updateSettings: protectedProcedure
    .input(serviceProfileSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        if (input.defaultLocationId) {
          const location = await tx.userLocation.findFirst({
            where: {
              id: input.defaultLocationId,
              userId,
              archivedAt: null,
            },
            select: { id: true },
          });
          if (!location) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "RESOURCE_NOT_FOUND",
            });
          }
        }
        const updated = await tx.serviceProfile.updateMany({
          where: { userId },
          data: input,
        });
        if (updated.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        return tx.serviceProfile.findUniqueOrThrow({
          where: { userId },
          select: {
            id: true,
            introduction: true,
            monthsExperience: true,
            baseCurrency: true,
            defaultLocationId: true,
            isAccepting: true,
          },
        });
      });
    }),
  setAccepting: protectedProcedure
    .input(acceptingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.serviceProfile.updateMany({
          where: { userId },
          data: { isAccepting: input.active },
        });
        if (updated.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        if (input.active) {
          await tx.profile.updateMany({
            where: { userId },
            data: { isSitter: true },
          });
        }
        return tx.serviceProfile.findUniqueOrThrow({
          where: { userId },
          select: { id: true, isAccepting: true },
        });
      });
    }),
  getLocationAndCurrency: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const serviceProfile = await ctx.prisma.serviceProfile.findUnique({
      where: { userId },
      select: {
        baseAreaRaw: true,
        baseLat: true,
        baseLon: true,
        baseCurrency: true,
        defaultLocation: {
          select: { lat: true, lon: true, regionLabel: true },
        },
      },
    });
    if (!serviceProfile) return null;
    return {
      baseAreaRaw:
        serviceProfile.defaultLocation?.regionLabel ?? serviceProfile.baseAreaRaw,
      baseLat: serviceProfile.defaultLocation
        ? Number(serviceProfile.defaultLocation.lat)
        : serviceProfile.baseLat,
      baseLon: serviceProfile.defaultLocation
        ? Number(serviceProfile.defaultLocation.lon)
        : serviceProfile.baseLon,
      baseCurrency: serviceProfile.baseCurrency,
    };
  }),
  toggleSitterStatus: protectedProcedure
    .input(acceptingStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const serviceProfile = await tx.serviceProfile.upsert({
          where: { userId },
          update: { isAccepting: input.active },
          create: { userId, isAccepting: input.active },
        });
        const profile = await tx.profile.updateMany({
          where: { userId },
          data: { isSitter: true },
        });
        if (profile.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        return serviceProfile;
      });
    }),
});
