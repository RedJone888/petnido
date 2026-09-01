import type { Prisma } from "@prisma/client";

import { parseNumberArray, parseStringArray } from "@/domain/service/v2-dto";

const providerSelect = {
  id: true,
  isAccepting: true,
  introduction: true,
  monthsExperience: true,
  rating: true,
  reviewCount: true,
  user: {
    select: { id: true, name: true, image: true, createdAt: true },
  },
} as const;

export const publicServiceV2Include = {
  serviceProfile: { select: providerSelect },
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
    include: { attachment: { select: { id: true, url: true } } },
  },
} as const;

export type PublicServiceV2Source = Prisma.ServiceV2GetPayload<{
  include: typeof publicServiceV2Include;
}>;

function providerDto(profile: PublicServiceV2Source["serviceProfile"]) {
  return {
    publicId: profile.user.id,
    nickname: profile.user.name,
    image: profile.user.image,
    memberSince: profile.user.createdAt,
    introduction: profile.introduction,
    monthsExperience: profile.monthsExperience,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
  };
}

function dateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function toPublicServiceV2MarketplaceDto(
  service: PublicServiceV2Source,
  distanceMeters: number | null,
) {
  return {
    publicId: `v2:${service.id}`,
    source: "V2" as const,
    mode: service.mode,
    title: service.title,
    description: service.description,
    timeZone: service.timeZone,
    currency: service.currency,
    serviceRadiusMeters: service.serviceRadiusMeters,
    maxPetCapacity: service.mode === "BOARDING" ? service.maxPetCapacity : null,
    location: {
      label: service.locationSnapshot.label,
      regionLabel: service.locationSnapshot.regionLabel,
      displayPrecision: service.locationSnapshot.displayPrecision,
      distanceMeters,
    },
    availabilityRules: service.availabilityRules.map((rule) => ({
      kind: rule.kind,
      weekdays: parseNumberArray(rule.weekdays),
      startsOn: dateOnly(rule.startsOn),
      endsOn: dateOnly(rule.endsOn),
      includesHolidays: rule.includesHolidays,
    })),
    availabilityExceptions: service.availabilityExceptions.map((exception) => ({
      date: dateOnly(exception.date)!,
      available: exception.available,
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
    boardingEnvironment: service.boardingDetail
      ? {
          environmentDescription: service.boardingDetail.environmentDescription,
          residentPetNotes: service.boardingDetail.residentPetNotes,
          suppliedItems: parseStringArray(service.boardingDetail.suppliedItems),
        }
      : null,
    attachments: service.attachments.map((item) => ({
      id: item.attachment.id,
      url: item.attachment.url,
      purpose: item.purpose,
      order: item.order,
    })),
    provider: providerDto(service.serviceProfile),
    confirmedBookings: { status: "AVAILABLE_BY_DATE" as const, count: null, date: null },
    createdAt: service.createdAt,
  };
}

export type PublicServiceDto = ReturnType<typeof toPublicServiceV2MarketplaceDto>;

export function serviceAvailableOn(
  service: Pick<PublicServiceDto, "availabilityRules" | "availabilityExceptions">,
  date: string,
) {
  const exception = service.availabilityExceptions.find((item) => item.date === date);
  if (exception) return exception.available;
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;
  return service.availabilityRules.some((rule) =>
    rule.kind === "WEEKLY"
      ? rule.weekdays.includes(weekday)
      : Boolean(rule.startsOn && rule.endsOn && date >= rule.startsOn && date <= rule.endsOn),
  );
}

export function publicProviderFromServices(services: PublicServiceDto[]) {
  if (!services.length) return null;
  const provider = services[0].provider;
  const petTypes = [...new Set(services.flatMap((service) => service.petPolicies.filter((policy) => policy.accepted).map((policy) => policy.petType)))];
  const modes = [...new Set(services.map((service) => service.mode))];
  const minimumPrice = services.flatMap((service) => service.priceRules.map((rule) => ({ currency: service.currency, amountMinor: rule.amountMinor }))).sort((a, b) => a.amountMinor - b.amountMinor)[0] ?? null;
  return { ...provider, serviceCount: services.length, modes, petTypes, minimumPrice };
}
