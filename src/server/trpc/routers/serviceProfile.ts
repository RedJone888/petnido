import { router, protectedProcedure } from "@/server/trpc/trpc";
import {
  acceptingStatusSchema,
  onboardingProviderProfileSchema,
  serviceProfileSettingsSchema,
} from "@/lib/zod/serviceProfile";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;
const bulkCommandSchema = z.discriminatedUnion("command", [
  z.object({ command: z.literal("PAUSE_ALL"), expectedProfileUpdatedAt: z.coerce.date() }).strict(),
  z.object({ command: z.literal("RESUME_ALL"), expectedProfileUpdatedAt: z.coerce.date() }).strict(),
  z.object({ command: z.literal("SET_LOCATION"), expectedProfileUpdatedAt: z.coerce.date(), locationId: z.string().min(1) }).strict(),
  z.object({ command: z.literal("SET_CURRENCY"), expectedProfileUpdatedAt: z.coerce.date(), currency: z.enum(currencies) }).strict(),
]);

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
          updatedAt: true,
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
  executeBulkCommand: protectedProcedure
    .input(bulkCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const profile = await tx.serviceProfile.findUnique({ where: { userId }, select: { id: true, updatedAt: true } });
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        let location: { id: string; lat: Prisma.Decimal; lon: Prisma.Decimal; regionLabel: string | null; displayPrecision: string } | null = null;
        if (input.command === "SET_LOCATION") {
          location = await tx.userLocation.findFirst({
            where: { id: input.locationId, userId, archivedAt: null },
            select: { id: true, lat: true, lon: true, regionLabel: true, displayPrecision: true },
          });
          if (!location) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        const profileData = input.command === "PAUSE_ALL"
          ? { isAccepting: false }
          : input.command === "RESUME_ALL"
            ? { isAccepting: true }
            : input.command === "SET_CURRENCY"
              ? { baseCurrency: input.currency }
              : { defaultLocationId: location!.id, baseLat: Number(location!.lat), baseLon: Number(location!.lon), baseAreaRaw: location!.regionLabel };
        const claimed = await tx.serviceProfile.updateMany({
          where: { id: profile.id, userId, updatedAt: input.expectedProfileUpdatedAt }, data: profileData,
        });
        if (claimed.count !== 1) throw new TRPCError({ code: "CONFLICT", message: "CONFLICTING_UPDATE" });
        let v2Count = 0;
        let legacyCount = 0;
        if (input.command === "PAUSE_ALL" || input.command === "RESUME_ALL") {
          const nextV2 = input.command === "PAUSE_ALL" ? "PAUSED" : "ACTIVE";
          const currentV2 = input.command === "PAUSE_ALL" ? "ACTIVE" : "PAUSED";
          v2Count = (await tx.serviceV2.updateMany({ where: { serviceProfileId: profile.id, archivedAt: null, state: currentV2 }, data: { state: nextV2 } })).count;
          legacyCount = (await tx.service.updateMany({ where: { serviceProfileId: profile.id, archivedAt: null, isActive: input.command === "PAUSE_ALL" }, data: { isActive: input.command === "RESUME_ALL" } })).count;
          if (input.command === "RESUME_ALL") await tx.profile.updateMany({ where: { userId }, data: { isSitter: true } });
        } else if (input.command === "SET_CURRENCY") {
          v2Count = (await tx.serviceV2.updateMany({ where: { serviceProfileId: profile.id, archivedAt: null }, data: { currency: input.currency } })).count;
          legacyCount = (await tx.service.updateMany({ where: { serviceProfileId: profile.id, archivedAt: null }, data: { currency: input.currency } })).count;
        } else {
          const services = await tx.serviceV2.findMany({ where: { serviceProfileId: profile.id, archivedAt: null }, select: { locationSnapshotId: true } });
          v2Count = (await tx.locationSnapshotV2.updateMany({
            where: { id: { in: services.map((item) => item.locationSnapshotId) } },
            data: { sourceLocationId: location!.id, lat: location!.lat, lon: location!.lon, regionLabel: location!.regionLabel, displayPrecision: location!.displayPrecision },
          })).count;
          legacyCount = (await tx.service.updateMany({
            where: { serviceProfileId: profile.id, archivedAt: null },
            data: { areaLat: Number(location!.lat), areaLon: Number(location!.lon), areaRaw: location!.regionLabel ?? "Map point" },
          })).count;
        }
        const updatedProfile = await tx.serviceProfile.findUniqueOrThrow({ where: { id: profile.id }, select: { isAccepting: true, baseCurrency: true, defaultLocationId: true, updatedAt: true } });
        return { command: input.command, affected: { v2: v2Count, legacy: legacyCount }, profile: updatedProfile, existingBookingsChanged: false };
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
