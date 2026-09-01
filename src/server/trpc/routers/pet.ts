import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { petCreateSchema, petIdSchema, petUpdateSchema } from "@/lib/zod/pet";
import { linkPhotos, syncPhotos } from "@/server/lib/photos";
import { protectedProcedure, router } from "@/server/trpc/trpc";

type PetFingerprintSource = {
  name: string | null;
  type: string;
  customType: string | null;
  breed: string | null;
  birthDate: Date | null;
  weightGrams: number | null;
  sex: string | null;
  neutered: string | null;
};

function petFingerprint(pet: PetFingerprintSource) {
  const normalize = (value: string | null) => value?.trim().toLocaleLowerCase() ?? "";
  return [
    normalize(pet.name),
    pet.type,
    normalize(pet.customType),
    normalize(pet.breed),
    pet.birthDate?.toISOString().slice(0, 10) ?? "",
    pet.weightGrams ?? "",
    pet.sex ?? "",
    pet.neutered ?? "",
  ].join("|");
}

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

  listImportCandidates: protectedProcedure.query(async ({ ctx }) => {
    const [activePets, snapshots] = await Promise.all([
      ctx.prisma.pet.findMany({
        where: { ownerId: ctx.session.user.id, archivedAt: null },
        select: {
          id: true,
          name: true,
          type: true,
          customType: true,
          breed: true,
          birthDate: true,
          weightGrams: true,
          sex: true,
          neutered: true,
        },
      }),
      ctx.prisma.needPetSnapshotV2.findMany({
        where: { need: { ownerId: ctx.session.user.id } },
        select: {
          id: true,
          sourcePetId: true,
          name: true,
          petType: true,
          customPetType: true,
          breed: true,
          birthDate: true,
          weightGrams: true,
          sex: true,
          neutered: true,
          careNotes: true,
          need: { select: { updatedAt: true } },
        },
        orderBy: { need: { updatedAt: "desc" } },
        take: 200,
      }),
    ]);
    const activeIds = new Set(activePets.map((pet) => pet.id));
    const activeFingerprints = new Set(activePets.map(petFingerprint));
    const candidates = new Map<string, (typeof snapshots)[number]>();
    for (const snapshot of snapshots) {
      if (snapshot.sourcePetId && activeIds.has(snapshot.sourcePetId)) continue;
      const fingerprint = petFingerprint({
        name: snapshot.name,
        type: snapshot.petType,
        customType: snapshot.customPetType,
        breed: snapshot.breed,
        birthDate: snapshot.birthDate,
        weightGrams: snapshot.weightGrams,
        sex: snapshot.sex,
        neutered: snapshot.neutered,
      });
      if (activeFingerprints.has(fingerprint) || candidates.has(fingerprint)) continue;
      candidates.set(fingerprint, snapshot);
    }
    return [...candidates.values()].map((snapshot) => ({
      snapshotId: snapshot.id,
      name: snapshot.name,
      type: snapshot.petType,
      customType: snapshot.customPetType,
      breed: snapshot.breed,
      birthDate: snapshot.birthDate,
      weightGrams: snapshot.weightGrams,
      sex: snapshot.sex,
      neutered: snapshot.neutered,
      notes: snapshot.careNotes,
      lastUsedAt: snapshot.need.updatedAt,
    }));
  }),

  importFromNeedSnapshot: protectedProcedure
    .input(z.object({ snapshotId: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const snapshot = await tx.needPetSnapshotV2.findFirst({
          where: {
            id: input.snapshotId,
            need: { ownerId: ctx.session.user.id },
          },
        });
        if (!snapshot) {
          throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        }
        if (snapshot.sourcePetId) {
          const activeSource = await tx.pet.findFirst({
            where: { id: snapshot.sourcePetId, ownerId: ctx.session.user.id, archivedAt: null },
          });
          if (activeSource) return activeSource;
        }
        const activePets = await tx.pet.findMany({
          where: { ownerId: ctx.session.user.id, archivedAt: null },
        });
        const snapshotFingerprint = petFingerprint({
          name: snapshot.name,
          type: snapshot.petType,
          customType: snapshot.customPetType,
          breed: snapshot.breed,
          birthDate: snapshot.birthDate,
          weightGrams: snapshot.weightGrams,
          sex: snapshot.sex,
          neutered: snapshot.neutered,
        });
        const matchingPet = activePets.find(
          (pet) => petFingerprint(pet) === snapshotFingerprint,
        );
        if (matchingPet) {
          await tx.needPetSnapshotV2.update({
            where: { id: snapshot.id },
            data: { sourcePetId: matchingPet.id },
          });
          return matchingPet;
        }
        const pet = await tx.pet.create({
          data: {
            ownerId: ctx.session.user.id,
            name: snapshot.name,
            type: snapshot.petType,
            customType: snapshot.customPetType,
            breed: snapshot.breed,
            birthDate: snapshot.birthDate,
            weightGrams: snapshot.weightGrams,
            sex: ["FEMALE", "MALE", "UNKNOWN"].includes(snapshot.sex) ? snapshot.sex : "UNKNOWN",
            neutered: ["YES", "NO", "UNKNOWN"].includes(snapshot.neutered) ? snapshot.neutered : "UNKNOWN",
            notes: snapshot.careNotes,
          },
        });
        await tx.needPetSnapshotV2.update({
          where: { id: snapshot.id },
          data: { sourcePetId: pet.id },
        });
        return pet;
      });
    }),

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
