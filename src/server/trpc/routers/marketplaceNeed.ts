import type { PetType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  publicNeedV2Include,
  toPublicNeedV2Dto,
} from "@/domain/marketplace/need-public-dto";
import {
  decodeMarketplaceCursor,
  encodeMarketplaceCursor,
  haversineDistanceMeters,
  withinBudget,
} from "@/domain/marketplace/pagination";
import { petTypeCodes } from "@/modules/need-publishing/domain/pet-types";
import { publicProcedure, router } from "@/server/trpc/trpc";

const modes = ["HOME_VISIT", "BOARDING", "CUSTOM"] as const;
const currencies = ["JPY", "USD", "EUR", "CNY", "TWD", "KRW", "GBP"] as const;

const filterSchema = z.object({
  modes: z.array(z.enum(modes)).max(3).default([]),
  petTypes: z.array(z.enum(petTypeCodes)).max(20).default([]),
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
  if (filter.minBudgetMinor !== undefined && filter.maxBudgetMinor !== undefined && filter.minBudgetMinor > filter.maxBudgetMinor) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_BUDGET_RANGE" });
  }
  if (filter.availableFrom && filter.availableTo && new Date(filter.availableFrom) >= new Date(filter.availableTo)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "INVALID_TIME_RANGE" });
  }
});

function publicId(value: string) {
  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("v2:") || decoded.length <= 3) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_PUBLIC_ID" });
  }
  return decoded.slice(3);
}

export const marketplaceNeedRouter = router({
  list: publicProcedure
    .input(z.object({
      filter: filterSchema.default({}),
      limit: z.number().int().min(1).max(30).default(20),
      cursor: z.string().optional(),
    }).strict().default({ filter: {}, limit: 20 }))
    .query(async ({ ctx, input }) => {
      const cursor = decodeMarketplaceCursor(input.cursor);
      if (input.cursor && !cursor) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      const now = new Date();
      const endAfter = input.filter.availableFrom && new Date(input.filter.availableFrom) > now
        ? new Date(input.filter.availableFrom)
        : now;
      const accepted: Array<ReturnType<typeof toPublicNeedV2Dto>> = [];
      let scan = cursor;
      const batchSize = Math.max(40, input.limit * 2);

      while (accepted.length < input.limit + 1) {
        const rows = await ctx.prisma.needV2.findMany({
          where: {
            state: "OPEN",
            archivedAt: null,
            endsAt: { gt: endAfter },
            ...(input.filter.modes.length ? { mode: { in: input.filter.modes } } : {}),
            ...(input.filter.petTypes.length ? { pets: { some: { petType: { in: input.filter.petTypes as PetType[] } } } } : {}),
            ...(input.filter.taskCategories.length ? { tasks: { some: { category: { in: input.filter.taskCategories } } } } : {}),
            ...(input.filter.availableTo ? { startsAt: { lt: new Date(input.filter.availableTo) } } : {}),
            ...(scan ? { OR: [
              { createdAt: { lt: new Date(scan.createdAt) } },
              { createdAt: new Date(scan.createdAt), id: { lt: scan.id } },
            ] } : {}),
          },
          include: publicNeedV2Include,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: batchSize,
        });
        if (!rows.length) break;
        for (const row of rows) {
          const point = { lat: Number(row.locationSnapshot.lat), lon: Number(row.locationSnapshot.lon) };
          const distance = input.filter.origin ? haversineDistanceMeters(input.filter.origin, point) : null;
          if (input.filter.origin && distance! > input.filter.origin.radiusMeters) continue;
          if (!withinBudget({
            kind: row.budgetKind,
            minAmountMinor: row.minAmountMinor === null ? null : Number(row.minAmountMinor),
            maxAmountMinor: row.maxAmountMinor === null ? null : Number(row.maxAmountMinor),
            currency: row.currency,
          }, input.filter)) continue;
          accepted.push(toPublicNeedV2Dto(row, distance));
          if (accepted.length >= input.limit + 1) break;
        }
        const last = rows[rows.length - 1];
        scan = { createdAt: last.createdAt.toISOString(), source: "V2", id: last.id };
        if (rows.length < batchSize) break;
      }

      const items = accepted.slice(0, input.limit);
      const last = items[items.length - 1];
      return {
        items,
        nextCursor: accepted.length > input.limit && last
          ? encodeMarketplaceCursor({ createdAt: last.createdAt.toISOString(), source: "V2", id: last.id })
          : null,
      };
    }),

  get: publicProcedure
    .input(z.object({ publicId: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      const id = publicId(input.publicId);
      const now = new Date();
      const need = await ctx.prisma.needV2.findFirst({
        where: {
          id,
          archivedAt: null,
          OR: [
            { state: "OPEN", endsAt: { gt: now } },
            ...(ctx.session?.user?.id ? [{ ownerId: ctx.session.user.id }] : []),
          ],
        },
        include: publicNeedV2Include,
      });
      if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      return toPublicNeedV2Dto(need, null);
    }),
});
