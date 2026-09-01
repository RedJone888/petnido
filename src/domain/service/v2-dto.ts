import type { Prisma } from "@prisma/client";

import { serviceDraftPayloadSchema } from "@/domain/publishing/contracts";

export const ownerServiceV2Include = {
  locationSnapshot: true,
  boardingDetail: true,
  availabilityRules: { orderBy: { id: "asc" as const } },
  availabilityExceptions: { orderBy: { date: "asc" as const } },
  petPolicies: { orderBy: { id: "asc" as const } },
  offerings: { orderBy: { id: "asc" as const } },
  priceRules: { orderBy: { id: "asc" as const } },
  discounts: { orderBy: { id: "asc" as const } },
  attachments: {
    orderBy: { order: "asc" as const },
    include: {
      attachment: { select: { id: true, url: true, signature: true } },
    },
  },
} as const;

export type OwnerServiceV2 = Prisma.ServiceV2GetPayload<{
  include: typeof ownerServiceV2Include;
}>;

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.filter((item): item is number => typeof item === "number");
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is number => typeof item === "number")
      : [];
  } catch {
    return [];
  }
}

function dateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function toOwnerServiceV2Dto(service: OwnerServiceV2) {
  return {
    ...service,
    locationSnapshot: {
      ...service.locationSnapshot,
      lat: Number(service.locationSnapshot.lat),
      lon: Number(service.locationSnapshot.lon),
    },
    availabilityRules: service.availabilityRules.map((rule) => ({
      ...rule,
      weekdays: parseNumberArray(rule.weekdays),
    })),
    priceRules: service.priceRules.map((rule) => ({
      ...rule,
      amountMinor: Number(rule.amountMinor),
    })),
    boardingDetail: service.boardingDetail
      ? {
          ...service.boardingDetail,
          suppliedItems: parseStringArray(service.boardingDetail.suppliedItems),
        }
      : null,
  };
}

export function toServiceV2EditPayload(service: OwnerServiceV2) {
  const payload = {
    title: service.title,
    description: service.description,
    timeZone: service.timeZone,
    location: {
      sourceLocationId: service.locationSnapshot.sourceLocationId ?? undefined,
      lat: Number(service.locationSnapshot.lat),
      lon: Number(service.locationSnapshot.lon),
      label: service.locationSnapshot.label,
      regionLabel: service.locationSnapshot.regionLabel,
      displayPrecision: service.locationSnapshot.displayPrecision,
    },
    currency: service.currency,
    availabilityRules: service.availabilityRules.map((rule) => ({
      kind: rule.kind,
      weekdays: parseNumberArray(rule.weekdays),
      startsOn: dateOnly(rule.startsOn),
      endsOn: dateOnly(rule.endsOn),
      includesHolidays: rule.includesHolidays,
    })),
    availabilityExceptions: service.availabilityExceptions.map((exception) => ({
      date: dateOnly(exception.date),
      available: exception.available,
      note: exception.note,
    })),
    petPolicies: service.petPolicies.map((policy) => ({
      petType: policy.petType,
      size: policy.size,
      ageBand: policy.ageBand,
      accepted: policy.accepted,
      notes: policy.notes,
    })),
    offerings: service.offerings.map((offering) => ({
      category: offering.category,
      label: offering.label,
      description: offering.description,
    })),
    priceRules: service.priceRules.map((rule) => ({
      label: rule.label,
      unit: rule.unit,
      amountMinor: Number(rule.amountMinor),
    })),
    discounts: service.discounts.map((discount) => ({
      label: discount.label,
      kind: discount.kind,
      value: discount.value,
      condition: discount.condition,
    })),
    attachmentIds: service.attachments.map((item) => item.attachmentId),
    ...(service.mode === "HOME_VISIT"
      ? { homeVisit: { serviceRadiusMeters: service.serviceRadiusMeters! } }
      : {}),
    ...(service.mode === "BOARDING" && service.boardingDetail
      ? {
          boarding: {
            maxPetCapacity: service.maxPetCapacity!,
            environmentDescription: service.boardingDetail.environmentDescription,
            residentPetNotes: service.boardingDetail.residentPetNotes,
            suppliedItems: parseStringArray(service.boardingDetail.suppliedItems),
          },
        }
      : {}),
    ...(service.mode === "CUSTOM"
      ? { custom: { serviceRadiusMeters: service.serviceRadiusMeters } }
      : {}),
  };
  return serviceDraftPayloadSchema.parse(payload);
}

export function toPublicServiceV2Dto(service: OwnerServiceV2) {
  const owner = toOwnerServiceV2Dto(service);
  return {
    id: owner.id,
    mode: owner.mode,
    state: owner.state,
    title: owner.title,
    description: owner.description,
    timeZone: owner.timeZone,
    currency: owner.currency,
    serviceRadiusMeters: owner.serviceRadiusMeters,
    maxPetCapacity: owner.mode === "BOARDING" ? owner.maxPetCapacity : null,
    location: {
      label: owner.locationSnapshot.label,
      regionLabel: owner.locationSnapshot.regionLabel,
      displayPrecision: owner.locationSnapshot.displayPrecision,
    },
    availabilityRules: owner.availabilityRules.map(({ id: _id, serviceId: _serviceId, ...rule }) => rule),
    availabilityExceptions: owner.availabilityExceptions.map(({ id: _id, serviceId: _serviceId, note: _note, ...exception }) => exception),
    petPolicies: owner.petPolicies.map(({ id: _id, serviceId: _serviceId, ...policy }) => policy),
    offerings: owner.offerings.map(({ id: _id, serviceId: _serviceId, ...offering }) => offering),
    priceRules: owner.priceRules.map(({ id: _id, serviceId: _serviceId, ...rule }) => rule),
    discounts: owner.discounts.map(({ id: _id, serviceId: _serviceId, ...discount }) => discount),
    boardingEnvironment: owner.boardingDetail
      ? {
          environmentDescription: owner.boardingDetail.environmentDescription,
          residentPetNotes: owner.boardingDetail.residentPetNotes,
          suppliedItems: owner.boardingDetail.suppliedItems,
        }
      : null,
    attachments: owner.attachments.map((item) => ({
      id: item.attachment.id,
      url: item.attachment.url,
      purpose: item.purpose,
      order: item.order,
    })),
    createdAt: owner.createdAt,
    updatedAt: owner.updatedAt,
  };
}
