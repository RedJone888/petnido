import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  recommendNeedsForService,
  recommendServicesForNeed,
  type NeedMatchInput,
  type MatchAvailabilityRule,
  type ServiceMatchInput,
} from "@/domain/matching/recommendations";
import {
  publicLegacyNeedSelect,
  publicNeedV2Include,
  toPublicLegacyNeedDto,
  toPublicNeedV2Dto,
  type PublicLegacyNeedSource,
  type PublicNeedV2Source,
} from "@/domain/marketplace/need-public-dto";
import {
  publicLegacyServiceSelect,
  publicServiceV2Include,
  toPublicLegacyServiceDto,
  toPublicServiceV2MarketplaceDto,
  type PublicLegacyServiceSource,
  type PublicServiceV2Source,
} from "@/domain/marketplace/service-public-dto";
import { publishingV2ReadEnabled } from "@/server/feature-flags/publishing-v2";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const recommendationInput = z.object({ id: z.string().min(1), limit: z.number().int().min(1).max(12).default(6) }).strict();
const candidateWindow = 500;

function requireMatching() {
  if (!publishingV2ReadEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "FEATURE_NOT_AVAILABLE" });
  }
}

function dateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function legacyMinorAmount(value: number, currency: string) {
  return Math.round(value * (currency === "JPY" || currency === "KRW" ? 1 : 100));
}

function legacyMode(value: string) {
  return value === "VISIT" ? "HOME_VISIT" as const : value === "FOSTER" ? "BOARDING" as const : "CUSTOM" as const;
}

function legacyDistance(value: string | null) {
  return value === "WITHIN_3KM" ? 3_000 : value === "WITHIN_5KM" ? 5_000 : value === "WITHIN_10KM" ? 10_000 : null;
}

function toNeedMatchV2(need: PublicNeedV2Source, now: Date): NeedMatchInput {
  return {
    publicId: `v2:${need.id}`,
    ownerId: need.owner.id,
    mode: need.mode,
    startsAt: need.startsAt,
    endsAt: need.endsAt,
    location: { lat: Number(need.locationSnapshot.lat), lon: Number(need.locationSnapshot.lon) },
    petTypes: need.pets.flatMap((pet) => Array.from({ length: pet.quantity }, () => pet.petType)),
    taskCategories: need.tasks.map((task) => task.category),
    currency: need.currency,
    budgetKind: need.budgetKind,
    minAmountMinor: need.minAmountMinor === null ? null : Number(need.minAmountMinor),
    maxAmountMinor: need.maxAmountMinor === null ? null : Number(need.maxAmountMinor),
    homeVisitIntervalDays: need.homeVisitDetail?.intervalDays ?? null,
    maxProviderDistanceMeters: need.boardingDetail?.maxProviderDistanceMeters ?? null,
    isPublic: need.state === "OPEN" && need.archivedAt === null && need.endsAt > now,
  };
}

function toNeedMatchLegacy(need: PublicLegacyNeedSource, now: Date): NeedMatchInput {
  const interval = need.frequencyType === "EVERY_2_DAYS" ? 2 : need.frequencyType === "EVERY_3_DAYS" ? 3 : need.frequencyType === "CUSTOM" ? need.customDays : 1;
  return {
    publicId: `legacy:${need.id}`,
    ownerId: need.owner.id,
    mode: legacyMode(need.category),
    startsAt: need.startDate,
    endsAt: need.endDate,
    location: { lat: need.addressLat, lon: need.addressLon },
    petTypes: need.needPets.flatMap((pet) => Array.from({ length: pet.count }, () => pet.petType || String(pet.petCategory))),
    taskCategories: need.needPets.flatMap((pet) => pet.tags),
    currency: need.currency,
    budgetKind: "EXACT",
    minAmountMinor: legacyMinorAmount(need.totalPrice, need.currency),
    maxAmountMinor: null,
    homeVisitIntervalDays: interval,
    maxProviderDistanceMeters: legacyDistance(need.fosterRange),
    isPublic: need.status === "OPEN" && need.archivedAt === null && need.endDate > now,
  };
}

function toServiceMatchV2(service: PublicServiceV2Source): ServiceMatchInput {
  return {
    publicId: `v2:${service.id}`,
    providerId: service.serviceProfile.user.id,
    mode: service.mode,
    location: { lat: Number(service.locationSnapshot.lat), lon: Number(service.locationSnapshot.lon) },
    serviceRadiusMeters: service.serviceRadiusMeters,
    petTypes: service.petPolicies.filter((policy) => policy.accepted).map((policy) => policy.petType),
    offeringCategories: service.offerings.map((offering) => offering.category),
    currency: service.currency,
    priceAmountsMinor: service.priceRules.map((rule) => Number(rule.amountMinor)),
    availabilityRules: service.availabilityRules.flatMap<MatchAvailabilityRule>((rule) => {
      const startsOn = dateOnly(rule.startsOn);
      const endsOn = dateOnly(rule.endsOn);
      if (rule.kind === "DATE_RANGE") return startsOn && endsOn ? [{ kind: "DATE_RANGE" as const, startsOn, endsOn }] : [];
      return [{ kind: "WEEKLY" as const, weekdays: Array.from(rule.weekdays), startsOn, endsOn }];
    }),
    availabilityExceptions: service.availabilityExceptions.map((item) => ({ date: dateOnly(item.date)!, available: item.available })),
    isPublic: service.state === "ACTIVE" && service.archivedAt === null && service.serviceProfile.isAccepting,
  };
}

function toServiceMatchLegacy(service: PublicLegacyServiceSource): ServiceMatchInput {
  const weekdays = service.availabilityWeekPattern === "WEEKDAYS_ONLY" ? [1, 2, 3, 4, 5] : service.availabilityWeekPattern === "WEEKENDS_ONLY" ? [6, 7] : [1, 2, 3, 4, 5, 6, 7];
  const startsOn = dateOnly(service.availableFrom);
  const endsOn = dateOnly(service.availableTo);
  return {
    publicId: `legacy:${service.id}`,
    providerId: service.serviceProfile.user.id,
    mode: legacyMode(service.serviceType),
    location: { lat: service.areaLat, lon: service.areaLon },
    serviceRadiusMeters: null,
    petTypes: service.petTypes.map(String),
    offeringCategories: service.description ? ["LEGACY"] : [],
    currency: service.currency,
    priceAmountsMinor: service.priceRules.map((rule) => legacyMinorAmount(rule.price, service.currency)),
    availabilityRules: service.availabilityRangeType === "DATE_RANGE" && startsOn && endsOn
      ? [{ kind: "DATE_RANGE", startsOn, endsOn }]
      : [{ kind: "WEEKLY", weekdays }],
    availabilityExceptions: [],
    isPublic: service.isActive && service.archivedAt === null && service.serviceProfile.isAccepting,
  };
}

export const matchingRouter = router({
  forNeed: protectedProcedure.input(recommendationInput).query(async ({ ctx, input }) => {
    requireMatching();
    const now = new Date();
    const need = await ctx.prisma.needV2.findFirst({
      where: { id: input.id, ownerId: ctx.session.user.id, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
      include: publicNeedV2Include,
    });
    if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    const [v2, legacy] = await Promise.all([
      ctx.prisma.serviceV2.findMany({
        where: { state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true, userId: { not: ctx.session.user.id } } },
        include: publicServiceV2Include,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: candidateWindow,
      }),
      ctx.prisma.service.findMany({
        where: { isActive: true, archivedAt: null, serviceProfile: { isAccepting: true, userId: { not: ctx.session.user.id } } },
        select: publicLegacyServiceSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: candidateWindow,
      }),
    ]);
    const candidates = [...v2.map(toServiceMatchV2), ...legacy.map(toServiceMatchLegacy)];
    const result = recommendServicesForNeed(toNeedMatchV2(need, now), candidates, { limit: input.limit });
    const records = new Map<string, { dto: ReturnType<typeof toPublicServiceV2MarketplaceDto> | ReturnType<typeof toPublicLegacyServiceDto>; lat: number; lon: number }>([
      ...v2.map((item) => [`v2:${item.id}`, { dto: toPublicServiceV2MarketplaceDto(item, null), lat: Number(item.locationSnapshot.lat), lon: Number(item.locationSnapshot.lon) }] as const),
      ...legacy.map((item) => [`legacy:${item.id}`, { dto: toPublicLegacyServiceDto(item, null), lat: item.areaLat, lon: item.areaLon }] as const),
    ]);
    return {
      ...result,
      candidateWindowLimited: v2.length === candidateWindow || legacy.length === candidateWindow,
      items: result.items.flatMap((match) => {
        const record = records.get(match.publicId);
        if (!record) return [];
        const service = record.dto.source === "V2"
          ? toPublicServiceV2MarketplaceDto(v2.find((item) => `v2:${item.id}` === match.publicId)!, match.distanceMeters)
          : toPublicLegacyServiceDto(legacy.find((item) => `legacy:${item.id}` === match.publicId)!, match.distanceMeters);
        return [{ match, service }];
      }),
    };
  }),

  forService: protectedProcedure.input(recommendationInput).query(async ({ ctx, input }) => {
    requireMatching();
    const now = new Date();
    const service = await ctx.prisma.serviceV2.findFirst({
      where: { id: input.id, state: "ACTIVE", archivedAt: null, serviceProfile: { userId: ctx.session.user.id, isAccepting: true } },
      include: publicServiceV2Include,
    });
    if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    const [v2, legacy] = await Promise.all([
      ctx.prisma.needV2.findMany({
        where: { state: "OPEN", archivedAt: null, endsAt: { gt: now }, ownerId: { not: ctx.session.user.id } },
        include: publicNeedV2Include,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: candidateWindow,
      }),
      ctx.prisma.need.findMany({
        where: { status: "OPEN", archivedAt: null, endDate: { gt: now }, ownerId: { not: ctx.session.user.id } },
        select: publicLegacyNeedSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: candidateWindow,
      }),
    ]);
    const candidates = [...v2.map((item) => toNeedMatchV2(item, now)), ...legacy.map((item) => toNeedMatchLegacy(item, now))];
    const result = recommendNeedsForService(toServiceMatchV2(service), candidates, { limit: input.limit });
    const items: Array<{ match: (typeof result.items)[number]; need: ReturnType<typeof toPublicNeedV2Dto> | ReturnType<typeof toPublicLegacyNeedDto> }> = [];
    for (const match of result.items) {
      const v2Need = v2.find((item) => `v2:${item.id}` === match.publicId);
      if (v2Need) {
        items.push({ match, need: toPublicNeedV2Dto(v2Need, match.distanceMeters) });
        continue;
      }
      const legacyNeed = legacy.find((item) => `legacy:${item.id}` === match.publicId);
      if (legacyNeed) items.push({ match, need: toPublicLegacyNeedDto(legacyNeed, match.distanceMeters) });
    }
    return {
      ...result,
      candidateWindowLimited: v2.length === candidateWindow || legacy.length === candidateWindow,
      items,
    };
  }),
});
