import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  recommendNeedsForService,
  recommendServicesForNeed,
  type NeedMatchInput,
  type MatchAvailabilityRule,
  type ServiceMatchInput,
} from "@/domain/matching/recommendations";
import { publicNeedV2Include, toPublicNeedV2Dto, type PublicNeedV2Source } from "@/domain/marketplace/need-public-dto";
import { publicServiceV2Include, toPublicServiceV2MarketplaceDto, type PublicServiceV2Source } from "@/domain/marketplace/service-public-dto";
import { protectedProcedure, router } from "@/server/trpc/trpc";

const recommendationInput = z.object({ id: z.string().min(1), limit: z.number().int().min(1).max(12).default(6) }).strict();
const candidateWindow = 500;

function dateOnly(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function toNeedMatch(need: PublicNeedV2Source, now: Date): NeedMatchInput {
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

function toServiceMatch(service: PublicServiceV2Source): ServiceMatchInput {
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
      if (rule.kind === "DATE_RANGE") return startsOn && endsOn ? [{ kind: "DATE_RANGE", startsOn, endsOn }] : [];
      return [{ kind: "WEEKLY", weekdays: Array.from(rule.weekdays), startsOn, endsOn }];
    }),
    availabilityExceptions: service.availabilityExceptions.map((item) => ({ date: dateOnly(item.date)!, available: item.available })),
    isPublic: service.state === "ACTIVE" && service.archivedAt === null && service.serviceProfile.isAccepting,
  };
}

export const matchingRouter = router({
  forNeed: protectedProcedure.input(recommendationInput).query(async ({ ctx, input }) => {
    const now = new Date();
    const need = await ctx.prisma.needV2.findFirst({
      where: { id: input.id, ownerId: ctx.session.user.id, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
      include: publicNeedV2Include,
    });
    if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    const services = await ctx.prisma.serviceV2.findMany({
      where: { state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true, userId: { not: ctx.session.user.id } } },
      include: publicServiceV2Include,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: candidateWindow,
    });
    const result = recommendServicesForNeed(toNeedMatch(need, now), services.map(toServiceMatch), { limit: input.limit });
    return {
      ...result,
      candidateWindowLimited: services.length === candidateWindow,
      items: result.items.flatMap((match) => {
        const service = services.find((item) => `v2:${item.id}` === match.publicId);
        return service ? [{ match, service: toPublicServiceV2MarketplaceDto(service, match.distanceMeters) }] : [];
      }),
    };
  }),

  forService: protectedProcedure.input(recommendationInput).query(async ({ ctx, input }) => {
    const now = new Date();
    const service = await ctx.prisma.serviceV2.findFirst({
      where: { id: input.id, state: "ACTIVE", archivedAt: null, serviceProfile: { userId: ctx.session.user.id, isAccepting: true } },
      include: publicServiceV2Include,
    });
    if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
    const needs = await ctx.prisma.needV2.findMany({
      where: { state: "OPEN", archivedAt: null, endsAt: { gt: now }, ownerId: { not: ctx.session.user.id } },
      include: publicNeedV2Include,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: candidateWindow,
    });
    const result = recommendNeedsForService(toServiceMatch(service), needs.map((item) => toNeedMatch(item, now)), { limit: input.limit });
    return {
      ...result,
      candidateWindowLimited: needs.length === candidateWindow,
      items: result.items.flatMap((match) => {
        const need = needs.find((item) => `v2:${item.id}` === match.publicId);
        return need ? [{ match, need: toPublicNeedV2Dto(need, match.distanceMeters) }] : [];
      }),
    };
  }),
});
