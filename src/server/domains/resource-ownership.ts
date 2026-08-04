import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type OwnershipDb = Pick<
  Prisma.TransactionClient,
  "need" | "service" | "serviceProfile"
>;

export function resourceNotFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
}

export async function requireOwnedNeed(
  db: OwnershipDb,
  needId: string,
  userId: string,
) {
  const need = await db.need.findFirst({
    where: { id: needId, ownerId: userId, archivedAt: null },
    select: { id: true, ownerId: true, status: true, endDate: true },
  });

  if (!need) resourceNotFound();
  return need;
}

export async function requireOwnedService(
  db: OwnershipDb,
  serviceId: string,
  userId: string,
) {
  const service = await db.service.findFirst({
    where: {
      id: serviceId,
      archivedAt: null,
      serviceProfile: { userId },
    },
    select: {
      id: true,
      isActive: true,
      serviceProfileId: true,
    },
  });

  if (!service) resourceNotFound();
  return service;
}

export async function requireOwnedServiceProfile(
  db: OwnershipDb,
  userId: string,
) {
  const profile = await db.serviceProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  });

  if (!profile) resourceNotFound();
  return profile;
}
