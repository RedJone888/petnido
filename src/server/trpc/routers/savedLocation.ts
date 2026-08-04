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
        return tx.userLocation.create({
          data: {
            userId,
            label: input.label,
            lat: input.lat,
            lon: input.lon,
            regionLabel: input.regionLabel,
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
      const updated = await ctx.prisma.userLocation.updateMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          archivedAt: null,
        },
        data: { archivedAt: new Date(), isDefault: false },
      });
      if (updated.count !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
      return { success: true };
    }),
});
