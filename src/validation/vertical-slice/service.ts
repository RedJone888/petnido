import type { Prisma, PrismaClient } from "../../../.generated/validation-client";
import { z } from "zod";

import { assertBoardingCapacity, type ServiceMode } from "@/domain/service/capacity";
import { homeVisitNeedPublishSchema } from "@/lib/zod/need-contracts";
import { toPublicMapLocation } from "@/lib/zod/location";

export const validationPublishHomeVisitSchema = homeVisitNeedPublishSchema.extend({
  idempotencyKey: z.string().uuid(),
});

export const validationConfirmBookingSchema = z
  .object({
    serviceId: z.string().min(1),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    petCount: z.number().int().min(1).max(20),
    idempotencyKey: z.string().uuid(),
  })
  .strict();

type ValidationClient = PrismaClient | Prisma.TransactionClient;

function budgetColumns(budget: z.infer<typeof validationPublishHomeVisitSchema>["budget"]) {
  if (budget.kind === "FIXED") {
    return { budgetKind: budget.kind, minAmountMinor: budget.amountMinor, maxAmountMinor: budget.amountMinor };
  }
  if (budget.kind === "RANGE") {
    return {
      budgetKind: budget.kind,
      minAmountMinor: budget.minAmountMinor,
      maxAmountMinor: budget.maxAmountMinor,
    };
  }
  return { budgetKind: budget.kind, minAmountMinor: null, maxAmountMinor: null };
}

export async function publishHomeVisit(
  prisma: PrismaClient,
  ownerId: string,
  untrustedInput: unknown,
) {
  const input = validationPublishHomeVisitSchema.parse(untrustedInput);
  const existing = await prisma.validationNeed.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const petRecords = [];
    for (const petInput of input.pets) {
      if (petInput.source === "PROFILE") {
        const pet = await tx.validationPet.findFirst({ where: { id: petInput.petId, ownerId } });
        if (!pet) throw new Error("RESOURCE_NOT_FOUND");
        petRecords.push({ ref: petInput.petId, pet });
      } else {
        const pet = await tx.validationPet.create({
          data: {
            ownerId,
            name: petInput.name,
            petType: petInput.petType,
            careNotes: petInput.careNotes,
          },
        });
        petRecords.push({ ref: petInput.clientKey, pet });
      }
    }

    const need = await tx.validationNeed.create({
      data: {
        ownerId,
        idempotencyKey: input.idempotencyKey,
        mode: input.mode,
        title: input.title,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        timeZone: input.timeZone,
        lat: input.location.lat,
        lon: input.location.lon,
        regionLabel: input.location.regionLabel,
        currency: input.budget.currency,
        ...budgetColumns(input.budget),
      },
    });

    for (const { pet } of petRecords) {
      await tx.validationPetSnapshot.create({
        data: {
          needId: need.id,
          petId: pet.id,
          name: pet.name,
          petType: pet.petType,
          careNotes: pet.careNotes,
        },
      });
    }

    for (const visit of input.visits) {
      for (const task of visit.tasks) {
        await tx.validationNeedTask.create({
          data: {
            needId: need.id,
            scheduledAt: new Date(visit.scheduledAt),
            petRef: task.petRef,
            category: task.taskCategory,
            instructions: task.instructions,
          },
        });
      }
    }

    await tx.validationLocation.upsert({
      where: { userId: ownerId },
      update: input.location,
      create: { userId: ownerId, ...input.location },
    });
    return need;
  });
}

export async function listPublicNeeds(prisma: ValidationClient, now: Date) {
  const needs = await prisma.validationNeed.findMany({
    where: { state: "OPEN", endsAt: { gt: now } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return needs.map((need) => ({
    id: need.id,
    title: need.title,
    mode: need.mode,
    startsAt: need.startsAt.toISOString(),
    endsAt: need.endsAt.toISOString(),
    location: toPublicMapLocation({
      lat: need.lat,
      lon: need.lon,
      regionLabel: need.regionLabel ?? undefined,
      displayPrecision: "MAP_POINT",
    }),
  }));
}

export async function confirmValidationBooking(prisma: PrismaClient, untrustedInput: unknown) {
  const input = validationConfirmBookingSchema.parse(untrustedInput);
  const existing = await prisma.validationBooking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  const service = await prisma.validationService.findUnique({ where: { id: input.serviceId } });
  if (!service || service.state !== "ACTIVE") throw new Error("SERVICE_NOT_ACTIVE");

  assertBoardingCapacity({
    serviceMode: service.mode as ServiceMode,
    maxPetCapacity: service.maxPetCapacity,
    confirmedPetCount: 0,
    requestedPetCount: input.petCount,
  });

  if (service.mode === "BOARDING") {
    const dateKey = input.startsAt.slice(0, 10);
    await prisma.validationCapacityBucket.upsert({
      where: { serviceId_dateKey: { serviceId: service.id, dateKey } },
      update: {},
      create: {
        serviceId: service.id,
        dateKey,
        maxPetCapacity: service.maxPetCapacity!,
      },
    });
  }

  try {
    return await prisma.validationBooking.create({
        data: {
          serviceId: service.id,
          idempotencyKey: input.idempotencyKey,
          state: "CONFIRMED",
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          dateKey: input.startsAt.slice(0, 10),
          petCount: input.petCount,
        },
    });
  } catch (error) {
    const dateKey = input.startsAt.slice(0, 10);
    const capacity =
      service.mode === "BOARDING"
        ? await prisma.validationCapacityBucket.findUnique({
            where: { serviceId_dateKey: { serviceId: service.id, dateKey } },
          })
        : null;
    if (
      String(error).includes("BOARDING_CAPACITY_EXCEEDED") ||
      (capacity && capacity.bookedPetCount + input.petCount > capacity.maxPetCapacity)
    ) {
      throw new Error("BOARDING_CAPACITY_EXCEEDED");
    }
    throw error;
  }
}
