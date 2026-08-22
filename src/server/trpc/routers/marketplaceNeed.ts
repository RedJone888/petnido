import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PetType, Prisma, PrismaClient } from "@prisma/client";

import {
  publicLegacyNeedSelect,
  publicNeedV2Include,
  toPublicLegacyNeedDto,
  toPublicNeedV2Dto,
} from "@/domain/marketplace/need-public-dto";
import {
  compareMarketplaceItems,
  cursorForItem,
  decodeMarketplaceCursor,
  encodeMarketplaceCursor,
  haversineDistanceMeters,
  isAfterCursor,
  withinBudget,
  type MarketplaceCursor,
  type MarketplaceSource,
} from "@/domain/marketplace/pagination";
import { publicMarketplaceV2Enabled } from "@/server/feature-flags/publishing-v2";
import { publicProcedure, router } from "@/server/trpc/trpc";

const modes = ["HOME_VISIT", "BOARDING", "CUSTOM"] as const;
const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;

const needMarketplaceFilterSchema = z.object({
  modes: z.array(z.enum(modes)).max(3).default([]),
  petTypes: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  taskCategories: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  currency: z.enum(currencies).optional(),
  minBudgetMinor: z.number().int().safe().nonnegative().optional(),
  maxBudgetMinor: z.number().int().safe().nonnegative().optional(),
  availableFrom: z.string().datetime({ offset: true }).optional(),
  availableTo: z.string().datetime({ offset: true }).optional(),
  origin: z.object({
    lat: z.number().finite().min(-90).max(90),
    lon: z.number().finite().min(-180).max(180),
    radiusMeters: z.number().int().positive().max(500_000),
  }).strict().optional(),
}).strict().superRefine((filter, ctx) => {
  if (
    filter.minBudgetMinor !== undefined &&
    filter.maxBudgetMinor !== undefined &&
    filter.minBudgetMinor > filter.maxBudgetMinor
  ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_BUDGET_RANGE" });
  }
  if (
    filter.availableFrom &&
    filter.availableTo &&
    new Date(filter.availableFrom) >= new Date(filter.availableTo)
  ) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_TIME_RANGE" });
  }
});

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
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      ...(equalDate ? [equalDate] : []),
    ],
  };
}

function modeToLegacy(mode: (typeof modes)[number]) {
  if (mode === "HOME_VISIT") return "VISIT" as const;
  if (mode === "BOARDING") return "FOSTER" as const;
  return "OTHER" as const;
}

function legacyAmountMinor(amount: number, currency: string) {
  return Math.round(amount * (currency === "JPY" || currency === "KRW" ? 1 : 100));
}

type Candidate =
  | {
      source: "V2";
      id: string;
      createdAt: Date;
      lat: number;
      lon: number;
      record: Awaited<ReturnType<typeof fetchV2>>[number];
    }
  | {
      source: "LEGACY";
      id: string;
      createdAt: Date;
      lat: number;
      lon: number;
      record: Awaited<ReturnType<typeof fetchLegacy>>[number];
    };

type Filter = z.infer<typeof needMarketplaceFilterSchema>;
type Database = PrismaClient | Prisma.TransactionClient;

async function savedRegionLabels(
  prisma: Database,
  records: Array<Awaited<ReturnType<typeof fetchV2>>[number]>,
) {
  const sourceIds = [...new Set(records.flatMap((record) => {
    const sourceId = record.locationSnapshot.sourceLocationId;
    return !record.locationSnapshot.regionLabel && sourceId ? [sourceId] : [];
  }))];
  if (!sourceIds.length) return new Map<string, string>();
  const locations = await prisma.userLocation.findMany({
    where: { id: { in: sourceIds }, archivedAt: null },
    select: { id: true, regionLabel: true },
  });
  return new Map(locations.flatMap((location) => (
    location.regionLabel ? [[location.id, location.regionLabel] as const] : []
  )));
}

async function fetchV2(
  prisma: Database,
  filter: Filter,
  cursor: MarketplaceCursor | null,
  take: number,
  now: Date,
) {
  const endAfter = filter.availableFrom && new Date(filter.availableFrom) > now
    ? new Date(filter.availableFrom)
    : now;
  return prisma.needV2.findMany({
    where: {
      state: "OPEN",
      archivedAt: null,
      endsAt: { gt: endAfter },
      ...(filter.modes.length ? { mode: { in: filter.modes } } : {}),
      ...(filter.petTypes.length ? { pets: { some: { petType: { in: filter.petTypes } } } } : {}),
      ...(filter.taskCategories.length ? { tasks: { some: { category: { in: filter.taskCategories } } } } : {}),
      ...(filter.availableTo ? { startsAt: { lt: new Date(filter.availableTo) } } : {}),
      ...sourceCursorWhere(cursor, "V2"),
    },
    include: publicNeedV2Include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}

async function fetchLegacy(
  prisma: Database,
  filter: Filter,
  cursor: MarketplaceCursor | null,
  take: number,
  now: Date,
) {
  if (!("need" in prisma)) return [];
  if (filter.taskCategories.length) return [];
  const knownPetTypes = new Set(["DOG", "CAT", "RABBIT", "BIRD", "CHINCHILLA", "GUINEA_PIG", "HAMSTER", "OTHER"]);
  const legacyPetTypes = filter.petTypes.filter((type): type is PetType => knownPetTypes.has(type));
  const endAfter = filter.availableFrom && new Date(filter.availableFrom) > now
    ? new Date(filter.availableFrom)
    : now;
  return prisma.need.findMany({
    where: {
      status: "OPEN",
      archivedAt: null,
      endDate: { gt: endAfter },
      ...(filter.modes.length ? { category: { in: filter.modes.map(modeToLegacy) } } : {}),
      ...(filter.petTypes.length
        ? {
            needPets: {
              some: {
                OR: [
                  ...(legacyPetTypes.length ? [{ petCategory: { in: legacyPetTypes } }] : []),
                  { petType: { in: filter.petTypes } },
                ],
              },
            },
          }
        : {}),
      ...(filter.availableTo ? { startDate: { lt: new Date(filter.availableTo) } } : {}),
      ...sourceCursorWhere(cursor, "LEGACY"),
    },
    select: publicLegacyNeedSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}

function candidateMatches(candidate: Candidate, filter: Filter) {
  const budget = candidate.source === "V2"
    ? {
        kind: candidate.record.budgetKind,
        minAmountMinor: candidate.record.minAmountMinor === null ? null : Number(candidate.record.minAmountMinor),
        maxAmountMinor: candidate.record.maxAmountMinor === null ? null : Number(candidate.record.maxAmountMinor),
        currency: candidate.record.currency,
      }
    : {
        kind: "EXACT" as const,
        minAmountMinor: legacyAmountMinor(candidate.record.totalPrice, candidate.record.currency),
        maxAmountMinor: null,
        currency: candidate.record.currency,
      };
  if (!withinBudget(budget, filter)) return false;
  if (filter.origin) {
    return haversineDistanceMeters(filter.origin, { lat: candidate.lat, lon: candidate.lon }) <= filter.origin.radiusMeters;
  }
  return true;
}

export const marketplaceNeedRouter = router({
  list: publicProcedure
    .input(z.object({
      filter: needMarketplaceFilterSchema.default({}),
      limit: z.number().int().min(1).max(30).default(20),
      cursor: z.string().optional(),
    }).strict().default({ filter: {}, limit: 20 }))
    .query(async ({ ctx, input }) => {
      requireMarketplace();
      const decoded = decodeMarketplaceCursor(input.cursor);
      if (input.cursor && !decoded) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      }
      const now = new Date();
      const batchSize = Math.max(40, input.limit * 2);
      let scanCursor = decoded;
      let v2Exhausted = false;
      let legacyExhausted = false;
      const accepted: Candidate[] = [];
      while (accepted.length < input.limit + 1 && !(v2Exhausted && legacyExhausted)) {
        const [v2, legacy] = await Promise.all([
          v2Exhausted ? Promise.resolve([]) : fetchV2(ctx.prisma, input.filter, scanCursor, batchSize, now),
          legacyExhausted ? Promise.resolve([]) : fetchLegacy(ctx.prisma, input.filter, scanCursor, batchSize, now),
        ]);
        if (v2.length < batchSize) v2Exhausted = true;
        if (legacy.length < batchSize) legacyExhausted = true;
        const candidates: Candidate[] = [
          ...v2.map((record: Awaited<ReturnType<typeof fetchV2>>[number]) => ({ source: "V2" as const, id: record.id, createdAt: record.createdAt, lat: Number(record.locationSnapshot.lat), lon: Number(record.locationSnapshot.lon), record })),
          ...legacy.map((record: Awaited<ReturnType<typeof fetchLegacy>>[number]) => ({ source: "LEGACY" as const, id: record.id, createdAt: record.createdAt, lat: record.addressLat, lon: record.addressLon, record })),
        ].filter((item) => isAfterCursor(item, scanCursor)).sort(compareMarketplaceItems);
        if (!candidates.length) break;
        for (const candidate of candidates) {
          if (candidateMatches(candidate, input.filter)) accepted.push(candidate);
          if (accepted.length >= input.limit + 1) break;
        }
        scanCursor = cursorForItem(candidates[candidates.length - 1]);
      }
      const page = accepted.slice(0, input.limit);
      const pageV2Records = page.flatMap((candidate) => candidate.source === "V2" ? [candidate.record] : []);
      const regionLabels = await savedRegionLabels(ctx.prisma, pageV2Records);
      return {
        items: page.map((candidate) => {
          const distance = input.filter.origin
            ? haversineDistanceMeters(input.filter.origin, { lat: candidate.lat, lon: candidate.lon })
            : null;
          return candidate.source === "V2"
            ? toPublicNeedV2Dto(
                candidate.record,
                distance,
                candidate.record.locationSnapshot.sourceLocationId
                  ? regionLabels.get(candidate.record.locationSnapshot.sourceLocationId)
                  : null,
              )
            : toPublicLegacyNeedDto(candidate.record, distance);
        }),
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
      if (!id || (source !== "v2" && source !== "legacy")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_PUBLIC_ID" });
      }
      const now = new Date();
      if (source === "v2") {
        const need = await ctx.prisma.needV2.findFirst({
          where: { id, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
          include: publicNeedV2Include,
        });
        if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        const regionLabels = await savedRegionLabels(ctx.prisma, [need]);
        return toPublicNeedV2Dto(
          need,
          null,
          need.locationSnapshot.sourceLocationId
            ? regionLabels.get(need.locationSnapshot.sourceLocationId)
            : null,
        );
      }
      const need = await ctx.prisma.need.findFirst({
        where: { id, status: "OPEN", archivedAt: null, endDate: { gt: now } },
        select: publicLegacyNeedSelect,
      });
      if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      return toPublicLegacyNeedDto(need, null);
    }),
});
