import { TRPCError } from "@trpc/server";

import { petCreateSchema, petIdSchema, petUpdateSchema } from "@/lib/zod/pet";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const petRouter = router({
  listMine: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.pet.findMany({
      where: { ownerId: ctx.session.user.id, archivedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        breed: true,
        age: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ),

  create: protectedProcedure
    .input(petCreateSchema)
    .mutation(({ ctx, input }) =>
      ctx.prisma.pet.create({
        data: { ownerId: ctx.session.user.id, ...input },
      }),
    ),

  update: protectedProcedure
    .input(petUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updated = await ctx.prisma.pet.updateMany({
        where: { id, ownerId: ctx.session.user.id, archivedAt: null },
        data,
      });
      if (updated.count !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "RESOURCE_NOT_FOUND",
        });
      }
      return ctx.prisma.pet.findUniqueOrThrow({ where: { id } });
    }),

  archive: protectedProcedure
    .input(petIdSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.pet.updateMany({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
          archivedAt: null,
        },
        data: { archivedAt: new Date() },
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
