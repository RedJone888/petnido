import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { bookingLocalDateKeys } from "@/domain/booking/service-booking";
import {
  publicProviderFromServices,
  publicServiceV2Include,
  serviceAvailableOn,
  toPublicServiceV2MarketplaceDto,
  type PublicServiceDto,
} from "@/domain/marketplace/service-public-dto";
import {
  decodeMarketplaceCursor,
  encodeMarketplaceCursor,
  haversineDistanceMeters,
} from "@/domain/marketplace/pagination";
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

function publicId(value: string) {
  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("v2:") || decoded.length <= 3) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_PUBLIC_ID" });
  }
  return decoded.slice(3);
}

function priceMatches(service: PublicServiceDto, filter: z.infer<typeof filterSchema>) {
  if (filter.currency && service.currency !== filter.currency) return false;
  if (filter.minPriceMinor === undefined && filter.maxPriceMinor === undefined) return true;
  return service.priceRules.some((rule) =>
    (filter.minPriceMinor === undefined || rule.amountMinor >= filter.minPriceMinor) &&
    (filter.maxPriceMinor === undefined || rule.amountMinor <= filter.maxPriceMinor),
  );
}

export const marketplaceServiceRouter = router({
  list: publicProcedure
    .input(z.object({
      filter: filterSchema.default({}),
      limit: z.number().int().min(1).max(30).default(20),
      cursor: z.string().optional(),
    }).strict().default({ filter: {}, limit: 20 }))
    .query(async ({ ctx, input }) => {
      const cursor = decodeMarketplaceCursor(input.cursor);
      if (input.cursor && !cursor) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      const accepted: PublicServiceDto[] = [];
      let scan = cursor;
      const batchSize = Math.max(40, input.limit * 2);

      while (accepted.length < input.limit + 1) {
        const rows = await ctx.prisma.serviceV2.findMany({
          where: {
            state: "ACTIVE",
            archivedAt: null,
            serviceProfile: { isAccepting: true },
            ...(input.filter.modes.length ? { mode: { in: input.filter.modes } } : {}),
            ...(input.filter.petTypes.length ? { petPolicies: { some: { accepted: true, petType: { in: input.filter.petTypes } } } } : {}),
            ...(scan ? { OR: [
              { createdAt: { lt: new Date(scan.createdAt) } },
              { createdAt: new Date(scan.createdAt), id: { lt: scan.id } },
            ] } : {}),
          },
          include: publicServiceV2Include,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: batchSize,
        });
        if (!rows.length) break;
        for (const row of rows) {
          const point = { lat: Number(row.locationSnapshot.lat), lon: Number(row.locationSnapshot.lon) };
          const distance = input.filter.origin ? haversineDistanceMeters(input.filter.origin, point) : null;
          const dto = toPublicServiceV2MarketplaceDto(row, distance);
          if (!priceMatches(dto, input.filter)) continue;
          if (input.filter.availableOn && !serviceAvailableOn(dto, input.filter.availableOn)) continue;
          if (input.filter.origin && (distance! > input.filter.origin.radiusMeters ||
            ((dto.mode === "HOME_VISIT" || dto.mode === "CUSTOM") && dto.serviceRadiusMeters !== null && distance! > dto.serviceRadiusMeters))) continue;
          accepted.push(dto);
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
          ? encodeMarketplaceCursor({ createdAt: last.createdAt.toISOString(), source: "V2", id: last.publicId.slice(3) })
          : null,
      };
    }),

  get: publicProcedure
    .input(z.object({ publicId: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      const id = publicId(input.publicId);
      const service = await ctx.prisma.serviceV2.findFirst({
        where: { id, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
        include: publicServiceV2Include,
      });
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      return toPublicServiceV2MarketplaceDto(service, null);
    }),

  confirmedBookingCount: publicProcedure
    .input(z.object({ publicId: z.string().min(1).max(128), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict())
    .query(async ({ ctx, input }) => {
      const serviceId = publicId(input.publicId);
      const visible = await ctx.prisma.serviceV2.findFirst({
        where: { id: serviceId, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
        select: { id: true },
      });
      if (!visible) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      const anchor = new Date(`${input.date}T00:00:00.000Z`);
      const candidates = await ctx.prisma.serviceBookingV2.findMany({
        where: {
          serviceSource: "V2",
          serviceId,
          state: "CONFIRMED",
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
      const cursor = decodeMarketplaceCursor(input.cursor);
      if (input.cursor && !cursor) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_CURSOR" });
      const profiles = await ctx.prisma.serviceProfile.findMany({
        where: {
          isAccepting: true,
          servicesV2: { some: { state: "ACTIVE", archivedAt: null } },
          ...(cursor ? { OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
          ] } : {}),
        },
        include: { servicesV2: { where: { state: "ACTIVE", archivedAt: null }, include: publicServiceV2Include } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
      });
      const page = profiles.slice(0, input.limit);
      return {
        items: page.flatMap((profile) => {
          const provider = publicProviderFromServices(profile.servicesV2.map((service) => toPublicServiceV2MarketplaceDto(service, null)));
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
      const profile = await ctx.prisma.serviceProfile.findFirst({
        where: { userId: input.providerId, isAccepting: true, servicesV2: { some: { state: "ACTIVE", archivedAt: null } } },
        include: { servicesV2: { where: { state: "ACTIVE", archivedAt: null }, include: publicServiceV2Include } },
      });
      if (!profile) {
        const user = await ctx.prisma.user.findUnique({ where: { id: input.providerId }, include: { profile: true } });
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
        return {
          provider: {
            publicId: user.id,
            nickname: user.name,
            image: user.image,
            rating: 5,
            reviewCount: 0,
            monthsExperience: 0,
            serviceCount: 0,
            petTypes: [] as string[],
            introduction: user.profile?.bio ?? null,
            memberSince: user.createdAt,
          },
          services: [],
        };
      }
      const services = profile.servicesV2.map((service) => toPublicServiceV2MarketplaceDto(service, null));
      const provider = publicProviderFromServices(services);
      if (!provider) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      return { provider, services };
    }),
});
