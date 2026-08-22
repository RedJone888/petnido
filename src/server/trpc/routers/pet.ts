import { TRPCError } from "@trpc/server";

import { petCreateSchema, petIdSchema, petUpdateSchema } from "@/lib/zod/pet";
import { linkPhotos, syncPhotos } from "@/server/lib/photos";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const petRouter = router({
  listMine: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.pet.findMany({
      where: { ownerId: ctx.session.user.id, archivedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        customType: true,
        quantity: true,
        breed: true,
        age: true,
        birthDate: true,
        weightGrams: true,
        sex: true,
        neutered: true,
        notes: true,
        photos: {
          where: { status: 1 },
          select: { id: true, url: true, fileKey: true, signature: true },
          orderBy: { order: "asc" },
          take: 1,
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ),

  create: protectedProcedure
    .input(petCreateSchema)
    .mutation(({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const { photoIds = [], ...data } = input;
        const pet = await tx.pet.create({
          data: { ownerId: ctx.session.user.id, ...data },
        });
        await linkPhotos({
          tx,
          userId: ctx.session.user.id,
          photoIds,
          petId: pet.id,
        });
        return pet;
      }),
    ),

  update: protectedProcedure
    .input(petUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, photoIds, ...data } = input;
      return ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.pet.updateMany({
          where: { id, ownerId: ctx.session.user.id, archivedAt: null },
          data,
        });
        if (updated.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        if (photoIds) {
          await syncPhotos({
            tx,
            userId: ctx.session.user.id,
            photoIds,
            petId: id,
          });
        }
        return tx.pet.findUniqueOrThrow({ where: { id } });
      });
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
