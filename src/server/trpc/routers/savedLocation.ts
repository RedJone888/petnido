import { TRPCError } from "@trpc/server";

import {
  savedLocationCreateSchema,
  savedLocationIdSchema,
  savedLocationUpdateSchema,
} from "@/lib/zod/saved-location";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const locationSelect = {
  id: true,
  label: true,
  lat: true,
  lon: true,
  regionLabel: true,
  displayPrecision: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const savedLocationRouter = router({
  listMine: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.userLocation.findMany({
      where: { userId: ctx.session.user.id, archivedAt: null },
      select: locationSelect,
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ),

  create: protectedProcedure
    .input(savedLocationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const activeCount = await tx.userLocation.count({
          where: { userId, archivedAt: null },
        });
        const isDefault = input.makeDefault || activeCount === 0;
        if (isDefault) {
          await tx.userLocation.updateMany({
            where: { userId, archivedAt: null, isDefault: true },
            data: { isDefault: false },
          });
        }
        const resolvedRegionLabel =
          input.regionLabel?.trim() ||
          input.label?.trim() ||
          `${Number(input.lat).toFixed(4)}, ${Number(input.lon).toFixed(4)}`;
        return tx.userLocation.create({
          data: {
            userId,
            label: input.label?.trim() || null,
            lat: input.lat,
            lon: input.lon,
            regionLabel: resolvedRegionLabel,
            displayPrecision: input.displayPrecision,
            isDefault,
          },
          select: locationSelect,
        });
      });
    }),

  update: protectedProcedure
    .input(savedLocationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.userLocation.updateMany({
        where: { id, userId: ctx.session.user.id, archivedAt: null },
        data,
      });
      if (updated.count !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
      return ctx.prisma.userLocation.findUniqueOrThrow({
        where: { id },
        select: locationSelect,
      });
    }),

  setDefault: protectedProcedure
    .input(savedLocationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const target = await tx.userLocation.findFirst({
          where: { id: input.id, userId, archivedAt: null },
          select: { id: true },
        });
        if (!target) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        await tx.userLocation.updateMany({
          where: { userId, archivedAt: null, isDefault: true },
          data: { isDefault: false },
        });
        return tx.userLocation.update({
          where: { id: input.id },
          data: { isDefault: true },
          select: locationSelect,
        });
      });
    }),

  archive: protectedProcedure
    .input(savedLocationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const target = await tx.userLocation.findFirst({
          where: { id: input.id, userId, archivedAt: null },
          select: { id: true, isDefault: true },
        });
        if (!target) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        await tx.userLocation.update({
          where: { id: target.id },
          data: { archivedAt: new Date(), isDefault: false },
        });
        const replacement = target.isDefault
          ? await tx.userLocation.findFirst({
              where: { userId, archivedAt: null },
              orderBy: { createdAt: "asc" },
              select: { id: true },
            })
          : null;
        if (replacement) {
          await tx.userLocation.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
        await tx.serviceProfile.updateMany({
          where: { userId, defaultLocationId: target.id },
          data: { defaultLocationId: replacement?.id ?? null },
        });
        return { success: true, defaultLocationId: replacement?.id ?? null };
      });
    }),
});
