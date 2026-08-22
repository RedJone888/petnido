import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import type { ServicePublishInput } from "@/domain/publishing/contracts";

type Transaction = Prisma.TransactionClient;

function dateOnly(value: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function verifyOwnedReferences(
  tx: Transaction,
  ownerId: string,
  input: ServicePublishInput,
) {
  if (input.location.sourceLocationId) {
    const location = await tx.userLocation.findFirst({
      where: {
        id: input.location.sourceLocationId,
        userId: ownerId,
        archivedAt: null,
      },
      select: { id: true },
    });
    if (!location) {
      throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    }
  }

  if (input.attachmentIds.length) {
    const count = await tx.attachment.count({
      where: {
        id: { in: input.attachmentIds },
        userId: ownerId,
        status: { in: [0, 1] },
      },
    });
    if (count !== input.attachmentIds.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    }
  }
}

async function saveServiceProfileDefaults(
  tx: Transaction,
  ownerId: string,
  serviceProfileId: string,
  input: ServicePublishInput,
) {
  let savedLocationId = input.location.sourceLocationId ?? null;
  let locationCreated = false;
  if (!savedLocationId) {
    const existing = await tx.userLocation.findFirst({
      where: {
        userId: ownerId,
        archivedAt: null,
        lat: input.location.lat,
        lon: input.location.lon,
      },
      select: { id: true },
    });
    if (existing) {
      savedLocationId = existing.id;
    } else {
      const activeCount = await tx.userLocation.count({
        where: { userId: ownerId, archivedAt: null },
      });
      const resolvedRegionLabel =
        input.location.regionLabel?.trim() ||
        `${Number(input.location.lat).toFixed(4)}, ${Number(input.location.lon).toFixed(4)}`;
      const created = await tx.userLocation.create({
        data: {
          userId: ownerId,
          label: null,
          lat: input.location.lat,
          lon: input.location.lon,
          regionLabel: resolvedRegionLabel,
          displayPrecision: input.location.displayPrecision,
          isDefault: activeCount === 0,
        },
        select: { id: true },
      });
      savedLocationId = created.id;
      locationCreated = true;
    }
  }

  const updated = await tx.serviceProfile.updateMany({
    where: { id: serviceProfileId, userId: ownerId },
    data: {
      defaultLocationId: savedLocationId,
      baseCurrency: input.currency,
    },
  });
  if (updated.count !== 1) {
    throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
  }
  return { savedLocationId, locationCreated, currency: input.currency };
}

export async function publishServiceV2Transaction(
  tx: Transaction,
  ownerId: string,
  input: ServicePublishInput,
  now: Date,
  options: { validationArrayEncoding?: boolean; saveProfileDefaults?: boolean } = {},
) {
  const draft = await tx.publishDraftV2.findFirst({
    where: { id: input.draftId, ownerId },
    select: {
      id: true,
      kind: true,
      mode: true,
      schemaVersion: true,
      revision: true,
      status: true,
      publishedServiceId: true,
      editingServiceId: true,
    },
  });
  if (!draft) {
    throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
  }
  if (
    draft.status === "PUBLISHED" &&
    (draft.publishedServiceId || draft.editingServiceId)
  ) {
    return {
      serviceId: draft.publishedServiceId ?? draft.editingServiceId!,
      replayed: true,
      edited: Boolean(draft.editingServiceId),
    };
  }
  if (
    draft.kind !== "SERVICE" ||
    draft.status !== "ACTIVE" ||
    draft.schemaVersion !== input.schemaVersion ||
    draft.mode !== input.mode ||
    draft.revision !== input.revision
  ) {
    throw new TRPCError({ code: "CONFLICT", message: "DRAFT_REVISION_CONFLICT" });
  }

  const serviceProfile = await tx.serviceProfile.findUnique({
    where: { userId: ownerId },
    select: { id: true },
  });
  if (!serviceProfile) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "SERVICE_PROFILE_REQUIRED" });
  }
  await verifyOwnedReferences(tx, ownerId, input);

  const editTarget = draft.editingServiceId
    ? await tx.serviceV2.findFirst({
        where: {
          id: draft.editingServiceId,
          serviceProfile: { userId: ownerId },
          archivedAt: null,
          state: { not: "ARCHIVED" },
        },
        select: { id: true, locationSnapshotId: true, idempotencyKey: true },
      })
    : null;
  if (draft.editingServiceId && !editTarget) {
    throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
  }

  const existingService = draft.editingServiceId
    ? null
    : await tx.serviceV2.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: {
          id: true,
          serviceProfile: { select: { userId: true } },
          sourceDraft: { select: { id: true } },
        },
      });
  if (existingService) {
    if (
      existingService.serviceProfile.userId !== ownerId ||
      existingService.sourceDraft?.id !== input.draftId
    ) {
      throw new TRPCError({ code: "CONFLICT", message: "IDEMPOTENCY_KEY_REUSED" });
    }
    return { serviceId: existingService.id, replayed: true, edited: false };
  }

  const profileDefaults = options.saveProfileDefaults === false
    ? { savedLocationId: input.location.sourceLocationId ?? null, locationCreated: false, currency: input.currency }
    : await saveServiceProfileDefaults(tx, ownerId, serviceProfile.id, input);
  const serviceRadiusMeters =
    input.mode === "HOME_VISIT"
      ? input.homeVisit.serviceRadiusMeters
      : input.mode === "CUSTOM"
        ? input.custom.serviceRadiusMeters
        : null;
  const maxPetCapacity =
    input.mode === "BOARDING" ? input.boarding.maxPetCapacity : null;
  const commonData = {
    mode: input.mode,
    title: input.title,
    description: input.description,
    timeZone: input.timeZone,
    currency: input.currency,
    serviceRadiusMeters,
    maxPetCapacity,
    archivedAt: null,
  };

  let service: { id: string };
  if (editTarget) {
    await tx.locationSnapshotV2.update({
      where: { id: editTarget.locationSnapshotId },
      data: {
        sourceLocationId: input.location.sourceLocationId ?? null,
        lat: input.location.lat,
        lon: input.location.lon,
        regionLabel: input.location.regionLabel ?? null,
        displayPrecision: input.location.displayPrecision,
      },
    });
    await tx.serviceV2Attachment.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.boardingServiceDetailV2.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.serviceAvailabilityRuleV2.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.serviceAvailabilityExceptionV2.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.servicePetPolicyV2.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.serviceOfferingV2.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.servicePriceRuleV2.deleteMany({ where: { serviceId: editTarget.id } });
    await tx.serviceDiscountRuleV2.deleteMany({ where: { serviceId: editTarget.id } });
    service = await tx.serviceV2.update({
      where: { id: editTarget.id },
      data: commonData,
      select: { id: true },
    });
  } else {
    const location = await tx.locationSnapshotV2.create({
      data: {
        sourceLocationId: input.location.sourceLocationId ?? null,
        lat: input.location.lat,
        lon: input.location.lon,
        regionLabel: input.location.regionLabel ?? null,
        displayPrecision: input.location.displayPrecision,
      },
      select: { id: true },
    });
    service = await tx.serviceV2.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        serviceProfileId: serviceProfile.id,
        locationSnapshotId: location.id,
        state: "ACTIVE",
        ...commonData,
      },
      select: { id: true },
    });
  }

  await tx.serviceAvailabilityRuleV2.createMany({
    data: input.availabilityRules.map((rule) => ({
      serviceId: service.id,
      kind: rule.kind,
      weekdays: (options.validationArrayEncoding
        ? JSON.stringify(rule.weekdays)
        : rule.weekdays) as never,
      startsOn: dateOnly(rule.startsOn),
      endsOn: dateOnly(rule.endsOn),
      includesHolidays: rule.includesHolidays,
    })),
  });
  if (input.availabilityExceptions.length) {
    await tx.serviceAvailabilityExceptionV2.createMany({
      data: input.availabilityExceptions.map((exception) => ({
        serviceId: service.id,
        date: dateOnly(exception.date)!,
        available: exception.available,
        note: exception.note,
      })),
    });
  }
  await tx.servicePetPolicyV2.createMany({
    data: input.petPolicies.map((policy) => ({ serviceId: service.id, ...policy })),
  });
  await tx.serviceOfferingV2.createMany({
    data: input.offerings.map((offering) => ({ serviceId: service.id, ...offering })),
  });
  await tx.servicePriceRuleV2.createMany({
    data: input.priceRules.map((rule) => ({
      serviceId: service.id,
      label: rule.label,
      unit: rule.unit,
      amountMinor: BigInt(rule.amountMinor),
    })),
  });
  if (input.discounts.length) {
    await tx.serviceDiscountRuleV2.createMany({
      data: input.discounts.map((discount) => ({ serviceId: service.id, ...discount })),
    });
  }
  if (input.mode === "BOARDING") {
    await tx.boardingServiceDetailV2.create({
      data: {
        serviceId: service.id,
        environmentDescription: input.boarding.environmentDescription,
        residentPetNotes: input.boarding.residentPetNotes,
        suppliedItems: (options.validationArrayEncoding
          ? JSON.stringify(input.boarding.suppliedItems)
          : input.boarding.suppliedItems) as never,
      },
    });
  }
  if (input.attachmentIds.length) {
    await tx.serviceV2Attachment.createMany({
      data: input.attachmentIds.map((attachmentId, order) => ({
        serviceId: service.id,
        attachmentId,
        purpose: input.mode === "BOARDING" ? "ENVIRONMENT" : "EXPERIENCE",
        order,
      })),
    });
    await tx.attachment.updateMany({
      where: { id: { in: input.attachmentIds }, userId: ownerId, status: 0 },
      data: { status: 1 },
    });
  }

  const finalized = await tx.publishDraftV2.updateMany({
    where: {
      id: input.draftId,
      ownerId,
      kind: "SERVICE",
      mode: input.mode,
      status: "ACTIVE",
      schemaVersion: input.schemaVersion,
      revision: input.revision,
    },
    data: {
      status: "PUBLISHED",
      publishedServiceId: editTarget ? undefined : service.id,
      publishedAt: now,
      lastValidatedAt: now,
    },
  });
  if (finalized.count !== 1) {
    throw new TRPCError({ code: "CONFLICT", message: "DRAFT_REVISION_CONFLICT" });
  }

  return {
    serviceId: service.id,
    replayed: false,
    edited: Boolean(editTarget),
    profileDefaults,
  };
}
