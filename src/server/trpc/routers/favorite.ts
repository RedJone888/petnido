import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { favoriteTargetSchema, needFavoriteAvailability, serviceFavoriteAvailability } from "@/domain/marketplace/favorite";
import { publicLegacyNeedSelect, publicNeedV2Include, toPublicLegacyNeedDto, toPublicNeedV2Dto } from "@/domain/marketplace/need-public-dto";
import { publicLegacyServiceSelect, publicServiceV2Include, toPublicLegacyServiceDto, toPublicServiceV2MarketplaceDto } from "@/domain/marketplace/service-public-dto";
import { protectedProcedure, router } from "@/server/trpc/trpc";

async function assertPublicTarget(
  prisma: Pick<PrismaClient, "needV2" | "need" | "serviceV2" | "service">,
  target: z.output<typeof favoriteTargetSchema>,
  now: Date,
) {
  if (target.kind === "NEED" && target.source === "V2") {
    return Boolean(await prisma.needV2.findFirst({ where: { id: target.targetId, state: "OPEN", archivedAt: null, endsAt: { gt: now } }, select: { id: true } }));
  }
  if (target.kind === "NEED") {
    if (!("need" in prisma)) return false;
    return Boolean(await prisma.need.findFirst({ where: { id: target.targetId, status: "OPEN", archivedAt: null, endDate: { gt: now } }, select: { id: true } }));
  }
  if (target.source === "V2") {
    return Boolean(await prisma.serviceV2.findFirst({ where: { id: target.targetId, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } }, select: { id: true } }));
  }
  if (!("service" in prisma)) return false;
  return Boolean(await prisma.service.findFirst({ where: { id: target.targetId, isActive: true, archivedAt: null, serviceProfile: { isAccepting: true } }, select: { id: true } }));
}

export const favoriteRouter = router({
  set: protectedProcedure
    .input(z.object({ target: z.object({ kind: z.enum(["NEED", "SERVICE"]), publicId: z.string().min(1).max(256) }).strict(), favorite: z.boolean() }).strict())
    .mutation(async ({ ctx, input }) => {
      const target = favoriteTargetSchema.parse(input.target);
      const userId = ctx.session.user.id;
      if (!input.favorite) {
        await ctx.prisma.favoriteV2.deleteMany({
          where: { userId, targetKind: target.kind, targetSource: target.source, targetId: target.targetId },
        });
        return { favorite: false };
      }
      if (!(await assertPublicTarget(ctx.prisma, target, new Date()))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      await ctx.prisma.favoriteV2.upsert({
        where: {
          userId_targetKind_targetSource_targetId: {
            userId,
            targetKind: target.kind,
            targetSource: target.source,
            targetId: target.targetId,
          },
        },
        update: {},
        create: { userId, targetKind: target.kind, targetSource: target.source, targetId: target.targetId },
      });
      return { favorite: true };
    }),

  state: protectedProcedure
    .input(z.object({ kind: z.enum(["NEED", "SERVICE"]), publicId: z.string().min(1).max(256) }).strict())
    .query(async ({ ctx, input }) => {
      const target = favoriteTargetSchema.parse(input);
      const favorite = await ctx.prisma.favoriteV2.findUnique({
        where: {
          userId_targetKind_targetSource_targetId: {
            userId: ctx.session.user.id,
            targetKind: target.kind,
            targetSource: target.source,
            targetId: target.targetId,
          },
        },
        select: { id: true },
      });
      return { favorite: Boolean(favorite) };
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.prisma.favoriteV2.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const ids = (kind: "NEED" | "SERVICE", source: "V2" | "LEGACY") =>
      favorites.filter((item) => item.targetKind === kind && item.targetSource === source).map((item) => item.targetId);
    const supportsLegacyNeeds = "need" in ctx.prisma;
    const supportsLegacyServices = "service" in ctx.prisma;
    const [v2Needs, legacyNeeds, v2Services, legacyServices] = await Promise.all([
      ctx.prisma.needV2.findMany({ where: { id: { in: ids("NEED", "V2") } }, include: publicNeedV2Include }),
      supportsLegacyNeeds
        ? ctx.prisma.need.findMany({ where: { id: { in: ids("NEED", "LEGACY") } }, select: publicLegacyNeedSelect })
        : Promise.resolve([]),
      ctx.prisma.serviceV2.findMany({ where: { id: { in: ids("SERVICE", "V2") } }, include: publicServiceV2Include }),
      supportsLegacyServices
        ? ctx.prisma.service.findMany({ where: { id: { in: ids("SERVICE", "LEGACY") } }, select: publicLegacyServiceSelect })
        : Promise.resolve([]),
    ]);
    const v2NeedMap = new Map(v2Needs.map((item) => [item.id, item]));
    const legacyNeedMap = new Map(legacyNeeds.map((item) => [item.id, item]));
    const v2ServiceMap = new Map(v2Services.map((item) => [item.id, item]));
    const legacyServiceMap = new Map(legacyServices.map((item) => [item.id, item]));
    const now = new Date();
    return favorites.map((favorite) => {
      const targetPublicId = `${favorite.targetSource === "V2" ? "v2" : "legacy"}:${favorite.targetId}`;
      if (favorite.targetKind === "NEED") {
        const source = favorite.targetSource === "V2" ? v2NeedMap.get(favorite.targetId) : legacyNeedMap.get(favorite.targetId);
        if (!source) return { favoriteId: favorite.id, targetPublicId, kind: "NEED" as const, availability: "MISSING" as const, item: null, createdAt: favorite.createdAt };
        const normalized = favorite.targetSource === "V2"
          ? toPublicNeedV2Dto(source as (typeof v2Needs)[number], null)
          : toPublicLegacyNeedDto(source as (typeof legacyNeeds)[number], null);
        const availability = needFavoriteAvailability({
          state: favorite.targetSource === "V2" ? (source as (typeof v2Needs)[number]).state : (source as (typeof legacyNeeds)[number]).status,
          endsAt: favorite.targetSource === "V2" ? (source as (typeof v2Needs)[number]).endsAt : (source as (typeof legacyNeeds)[number]).endDate,
          archivedAt: favorite.targetSource === "V2" ? (source as (typeof v2Needs)[number]).archivedAt : (source as (typeof legacyNeeds)[number]).archivedAt,
        }, now);
        return { favoriteId: favorite.id, targetPublicId, kind: "NEED" as const, availability, item: normalized, createdAt: favorite.createdAt };
      }
      const source = favorite.targetSource === "V2" ? v2ServiceMap.get(favorite.targetId) : legacyServiceMap.get(favorite.targetId);
      if (!source) return { favoriteId: favorite.id, targetPublicId, kind: "SERVICE" as const, availability: "MISSING" as const, item: null, createdAt: favorite.createdAt };
      const normalized = favorite.targetSource === "V2"
        ? toPublicServiceV2MarketplaceDto(source as (typeof v2Services)[number], null)
        : toPublicLegacyServiceDto(source as (typeof legacyServices)[number], null);
      const availability = serviceFavoriteAvailability({
        active: favorite.targetSource === "V2" ? (source as (typeof v2Services)[number]).state === "ACTIVE" : (source as (typeof legacyServices)[number]).isActive,
        archivedAt: (source as { archivedAt: Date | null }).archivedAt,
        providerAccepting: (source as (typeof v2Services)[number] | (typeof legacyServices)[number]).serviceProfile.isAccepting,
      });
      return { favoriteId: favorite.id, targetPublicId, kind: "SERVICE" as const, availability, item: normalized, createdAt: favorite.createdAt };
    });
  }),
});
