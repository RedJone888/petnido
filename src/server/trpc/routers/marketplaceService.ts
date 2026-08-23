import type { PetType, Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { petTypeCodes } from "@/modules/need-publishing/domain/pet-types";
import { z } from "zod";
import { bookingLocalDateKeys } from "@/domain/booking/service-booking";

import {
  publicLegacyServiceSelect,
  publicServiceV2Include,
  serviceAvailableOn,
  toPublicLegacyServiceDto,
  toPublicServiceV2MarketplaceDto,
  publicProviderFromServices,
  type PublicServiceDto,
} from "@/domain/marketplace/service-public-dto";
import {
  compareMarketplaceItems,
  cursorForItem,
  decodeMarketplaceCursor,
  encodeMarketplaceCursor,
  haversineDistanceMeters,
  isAfterCursor,
  type MarketplaceCursor,
  type MarketplaceSource,
} from "@/domain/marketplace/pagination";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";
import { publicProcedure, router } from "@/server/trpc/trpc";

const modes = ["HOME_VISIT", "BOARDING", "CUSTOM"] as const;
const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;
const filterSchema = z.object({
  modes: z.array(z.enum(modes)).max(3).default([]),
  petTypes: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  currency: z.enum(currencies).optional(),
  minPriceMinor: z.number().int().safe().nonnegative().optional(),
  maxPriceMinor: z.number().int().safe().nonnegative().optional(),
  availableOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  origin: z.object({
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    radiusMeters: z.number().int().positive().max(500_000),
  }).strict().optional(),
}).strict().superRefine((filter, ctx) => {
  if (filter.minPriceMinor !== undefined && filter.maxPriceMinor !== undefined && filter.minPriceMinor > filter.maxPriceMinor) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_PRICE_RANGE" });
  }
});

type Filter = z.infer<typeof filterSchema>;
type Database = PrismaClient | Prisma.TransactionClient;

function requireMarketplace() {
  if (!publicMarketplaceV2Enabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "FEATURE_NOT_AVAILABLE" });
  }
}

function sourceRank(source: MarketplaceSource) {
  return source === "V2" ? 1 : 0;
}

function sourceCursorWhere(cursor: MarketplaceCursor | null, source: MarketplaceSource) {
  if (!cursor) return {};
  const createdAt = new Date(cursor.createdAt);
  const equalDate = sourceRank(source) < sourceRank(cursor.source)
    ? { createdAt }
    : source === cursor.source
      ? { createdAt, id: { lt: cursor.id } }
      : null;
  return { OR: [{ createdAt: { lt: createdAt } }, ...(equalDate ? [equalDate] : [])] };
}

function modeToLegacy(mode: (typeof modes)[number]) {
  return mode === "HOME_VISIT" ? "VISIT" as const : mode === "BOARDING" ? "FOSTER" as const : "OTHER" as const;
}

async function fetchV2(prisma: Database, filter: Filter, cursor: MarketplaceCursor | null, take: number) {
  return prisma.serviceV2.findMany({
    where: {
      state: "ACTIVE",
      archivedAt: null,
      serviceProfile: { isAccepting: true },
      ...(filter.modes.length ? { mode: { in: filter.modes } } : {}),
      ...(filter.petTypes.length ? { petPolicies: { some: { accepted: true, petType: { in: filter.petTypes } } } } : {}),
      ...sourceCursorWhere(cursor, "V2"),
    },
    include: publicServiceV2Include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}

async function fetchLegacy(prisma: Database, filter: Filter, cursor: MarketplaceCursor | null, take: number) {
  if (!("service" in prisma)) return [];
  const known = new Set<string>(petTypeCodes);
  const petTypes = filter.petTypes.filter((item): item is PetType => known.has(item));
  if (filter.petTypes.length && !petTypes.length) return [];
  return prisma.service.findMany({
    where: {
      isActive: true,
      archivedAt: null,
      serviceProfile: { isAccepting: true },
      ...(filter.modes.length ? { serviceType: { in: filter.modes.map(modeToLegacy) } } : {}),
      ...(petTypes.length ? { petTypes: { hasSome: petTypes } } : {}),
      ...sourceCursorWhere(cursor, "LEGACY"),
    },
    select: publicLegacyServiceSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}

type V2Record = Awaited<ReturnType<typeof fetchV2>>[number];
type LegacyRecord = Awaited<ReturnType<typeof fetchLegacy>>[number];
type Candidate =
  | { source: "V2"; id: string; createdAt: Date; lat: number; lon: number; record: V2Record }
  | { source: "LEGACY"; id: string; createdAt: Date; lat: number; lon: number; record: LegacyRecord };

function priceMatches(service: PublicServiceDto, filter: Filter) {
  if (filter.currency && service.currency !== filter.currency) return false;
  if (filter.minPriceMinor === undefined && filter.maxPriceMinor === undefined) return true;
  return service.priceRules.some((rule) =>
    (filter.minPriceMinor === undefined || rule.amountMinor >= filter.minPriceMinor) &&
    (filter.maxPriceMinor === undefined || rule.amountMinor <= filter.maxPriceMinor),
  );
}

function toDto(candidate: Candidate, origin: Filter["origin"]) {
  const distance = origin
    ? haversineDistanceMeters(origin, { lat: candidate.lat, lon: candidate.lon })
    : null;
  return candidate.source === "V2"
    ? toPublicServiceV2MarketplaceDto(candidate.record, distance)
    : toPublicLegacyServiceDto(candidate.record, distance);
}

function candidateMatches(candidate: Candidate, filter: Filter) {
  const dto = toDto(candidate, filter.origin);
  if (!priceMatches(dto, filter)) return false;
  if (filter.availableOn && !serviceAvailableOn(dto, filter.availableOn)) return false;
  if (filter.origin) {
    const distance = dto.location.distanceMeters!;
    if (distance > filter.origin.radiusMeters) return false;
    if (
      dto.source === "V2" &&
      (dto.mode === "HOME_VISIT" || dto.mode === "CUSTOM") &&
      dto.serviceRadiusMeters !== null &&
      distance > dto.serviceRadiusMeters
    ) return false;
  }
  return true;
}

export const marketplaceServiceRouter = router({
  list: publicProcedure
    .input(z.object({
      filter: filterSchema.default({}),
      limit: z.number().int().min(1).max(30).default(20),
      cursor: z.string().optional(),
    }).strict().default({ filter: {}, limit: 20 }))
    .query(async ({ ctx, input }) => {
      requireMarketplace();
      const decoded = decodeMarketplaceCursor(input.cursor);
      if (input.cursor && !decoded) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      const batchSize = Math.max(40, input.limit * 2);
      let scanCursor = decoded;
      let v2Exhausted = false;
      let legacyExhausted = false;
      const accepted: Candidate[] = [];
      while (accepted.length < input.limit + 1 && !(v2Exhausted && legacyExhausted)) {
        const [v2, legacy] = await Promise.all([
          v2Exhausted ? Promise.resolve([]) : fetchV2(ctx.prisma, input.filter, scanCursor, batchSize),
          legacyExhausted ? Promise.resolve([]) : fetchLegacy(ctx.prisma, input.filter, scanCursor, batchSize),
        ]);
        if (v2.length < batchSize) v2Exhausted = true;
        if (legacy.length < batchSize) legacyExhausted = true;
        const candidates: Candidate[] = [
          ...v2.map((record) => ({ source: "V2" as const, id: record.id, createdAt: record.createdAt, lat: Number(record.locationSnapshot.lat), lon: Number(record.locationSnapshot.lon), record })),
          ...legacy.map((record) => ({ source: "LEGACY" as const, id: record.id, createdAt: record.createdAt, lat: record.areaLat, lon: record.areaLon, record })),
        ].filter((item) => isAfterCursor(item, scanCursor)).sort(compareMarketplaceItems);
        if (!candidates.length) break;
        for (const candidate of candidates) {
          if (candidateMatches(candidate, input.filter)) accepted.push(candidate);
          if (accepted.length >= input.limit + 1) break;
        }
        scanCursor = cursorForItem(candidates[candidates.length - 1]);
      }
      const page = accepted.slice(0, input.limit);
      return {
        items: page.map((candidate) => toDto(candidate, input.filter.origin)),
        nextCursor: accepted.length > input.limit && page.length
          ? encodeMarketplaceCursor(cursorForItem(page[page.length - 1]))
          : null,
      };
    }),

  get: publicProcedure
    .input(z.object({ publicId: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      requireMarketplace();
      const decodedPublicId = decodeURIComponent(input.publicId);
      const separator = decodedPublicId.indexOf(":");
      const source = decodedPublicId.slice(0, separator);
      const id = decodedPublicId.slice(separator + 1);
      if (!id || (source !== "v2" && source !== "legacy")) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_PUBLIC_ID" });
      if (source === "v2") {
        const service = await ctx.prisma.serviceV2.findFirst({
          where: { id, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
          include: publicServiceV2Include,
        });
        if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        return toPublicServiceV2MarketplaceDto(service, null);
      }
      const service = await ctx.prisma.service.findFirst({
        where: { id, isActive: true, archivedAt: null, serviceProfile: { isAccepting: true } },
        select: publicLegacyServiceSelect,
      });
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      return toPublicLegacyServiceDto(service, null);
    }),

  confirmedBookingCount: publicProcedure
    .input(z.object({ publicId: z.string().min(1).max(128), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict())
    .query(async ({ ctx, input }) => {
      requireMarketplace();
      const decodedPublicId = decodeURIComponent(input.publicId);
      const separator = decodedPublicId.indexOf(":");
      const prefix = decodedPublicId.slice(0, separator);
      const serviceId = decodedPublicId.slice(separator + 1);
      if (!serviceId || (prefix !== "v2" && prefix !== "legacy")) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_PUBLIC_ID" });
      const source = prefix === "v2" ? "V2" as const : "LEGACY" as const;
      const visible = source === "V2"
        ? await ctx.prisma.serviceV2.findFirst({ where: { id: serviceId, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } }, select: { id: true } })
        : await ctx.prisma.service.findFirst({ where: { id: serviceId, isActive: true, archivedAt: null, serviceProfile: { isAccepting: true } }, select: { id: true } });
      if (!visible) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      const anchor = new Date(`${input.date}T00:00:00.000Z`);
      const candidates = await ctx.prisma.serviceBookingV2.findMany({
        where: {
          serviceSource: source, serviceId, state: "CONFIRMED",
          startsAt: { lt: new Date(anchor.getTime() + 2 * 86_400_000) },
          endsAt: { gt: new Date(anchor.getTime() - 86_400_000) },
        },
        select: { startsAt: true, endsAt: true, timeZone: true },
      });
      return { date: input.date, count: candidates.filter((booking) => bookingLocalDateKeys(booking.startsAt, booking.endsAt, booking.timeZone).includes(input.date)).length };
    }),

  listProviders: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(30).default(20), cursor: z.string().optional() }).strict().default({ limit: 20 }))
    .query(async ({ ctx, input }) => {
      requireMarketplace();
      const cursor = decodeMarketplaceCursor(input.cursor);
      if (input.cursor && !cursor) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      const profiles = await ctx.prisma.serviceProfile.findMany({
        where: {
          isAccepting: true,
          OR: [
            { servicesV2: { some: { state: "ACTIVE", archivedAt: null } } },
            { services: { some: { isActive: true, archivedAt: null } } },
          ],
          ...(cursor ? {
            AND: {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
              ],
            },
          } : {}),
        },
        include: {
          servicesV2: {
            where: { state: "ACTIVE", archivedAt: null },
            include: publicServiceV2Include,
          },
          services: {
            where: { isActive: true, archivedAt: null },
            select: publicLegacyServiceSelect,
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
      });
      const page = profiles.slice(0, input.limit);
      return {
        items: page.flatMap((profile) => {
          const services: PublicServiceDto[] = [
            ...profile.servicesV2.map((service) => toPublicServiceV2MarketplaceDto(service, null)),
            ...profile.services.map((service) => toPublicLegacyServiceDto(service, null)),
          ];
          const provider = publicProviderFromServices(services);
          return provider ? [provider] : [];
        }),
        nextCursor: profiles.length > input.limit && page.length
          ? encodeMarketplaceCursor({ createdAt: page[page.length - 1].createdAt.toISOString(), source: "V2", id: page[page.length - 1].id })
          : null,
      };
    }),

  getProvider: publicProcedure
    .input(z.object({ providerId: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      requireMarketplace();
      const profile = await ctx.prisma.serviceProfile.findFirst({
        where: {
          userId: input.providerId,
          isAccepting: true,
          OR: [
            { servicesV2: { some: { state: "ACTIVE", archivedAt: null } } },
            { services: { some: { isActive: true, archivedAt: null } } },
          ],
        },
        include: {
          servicesV2: { where: { state: "ACTIVE", archivedAt: null }, include: publicServiceV2Include },
          services: { where: { isActive: true, archivedAt: null }, select: publicLegacyServiceSelect },
        },
      });
      if (!profile) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.providerId },
          include: { profile: true },
        });
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        const provider = {
          publicId: user.id,
          nickname: user.name,
          image: user.image,
          rating: 5.0,
          reviewCount: 0,
          monthsExperience: 0,
          serviceCount: 0,
          petTypes: [] as string[],
          introduction: user.profile?.bio ?? null,
          memberSince: user.createdAt,
        };
        return { provider, services: [] };
      }
      const services: PublicServiceDto[] = [
        ...profile.servicesV2.map((service) => toPublicServiceV2MarketplaceDto(service, null)),
        ...profile.services.map((service) => toPublicLegacyServiceDto(service, null)),
      ];
      const provider = publicProviderFromServices(services);
      if (!provider) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      return { provider, services };
    }),
});
