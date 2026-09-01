import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { favoriteTargetSchema, needFavoriteAvailability, serviceFavoriteAvailability } from "@/domain/marketplace/favorite";
import { publicNeedV2Include, toPublicNeedV2Dto } from "@/domain/marketplace/need-public-dto";
import { publicServiceV2Include, toPublicServiceV2MarketplaceDto } from "@/domain/marketplace/service-public-dto";
import { protectedProcedure, router } from "@/server/trpc/trpc";

async function assertPublicTarget(
  prisma: Pick<PrismaClient, "needV2" | "serviceV2">,
  target: z.output<typeof favoriteTargetSchema>,
  now: Date,
) {
  if (target.kind === "NEED") {
    return Boolean(await prisma.needV2.findFirst({
      where: { id: target.targetId, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
      select: { id: true },
    }));
  }
  return Boolean(await prisma.serviceV2.findFirst({
    where: { id: target.targetId, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
    select: { id: true },
  }));
}

export const favoriteRouter = router({
  set: protectedProcedure
    .input(z.object({ target: z.object({ kind: z.enum(["NEED", "SERVICE"]), publicId: z.string().min(1).max(256) }).strict(), favorite: z.boolean() }).strict())
    .mutation(async ({ ctx, input }) => {
      const target = favoriteTargetSchema.parse(input.target);
      const userId = ctx.session.user.id;
      if (!input.favorite) {
        await ctx.prisma.favoriteV2.deleteMany({ where: { userId, targetKind: target.kind, targetSource: "V2", targetId: target.targetId } });
        return { favorite: false };
      }
      if (!(await assertPublicTarget(ctx.prisma, target, new Date()))) {
        throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      }
      await ctx.prisma.favoriteV2.upsert({
        where: { userId_targetKind_targetSource_targetId: { userId, targetKind: target.kind, targetSource: "V2", targetId: target.targetId } },
        update: {},
        create: { userId, targetKind: target.kind, targetSource: "V2", targetId: target.targetId },
      });
      return { favorite: true };
    }),

  state: protectedProcedure
    .input(z.object({ kind: z.enum(["NEED", "SERVICE"]), publicId: z.string().min(1).max(256) }).strict())
    .query(async ({ ctx, input }) => {
      const target = favoriteTargetSchema.parse(input);
      const favorite = await ctx.prisma.favoriteV2.findUnique({
        where: { userId_targetKind_targetSource_targetId: { userId: ctx.session.user.id, targetKind: target.kind, targetSource: "V2", targetId: target.targetId } },
        select: { id: true },
      });
      return { favorite: Boolean(favorite) };
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const favorites = await ctx.prisma.favoriteV2.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    const needIds = favorites.filter((item) => item.targetKind === "NEED").map((item) => item.targetId);
    const serviceIds = favorites.filter((item) => item.targetKind === "SERVICE").map((item) => item.targetId);
    const [needs, services] = await Promise.all([
      ctx.prisma.needV2.findMany({ where: { id: { in: needIds } }, include: publicNeedV2Include }),
      ctx.prisma.serviceV2.findMany({ where: { id: { in: serviceIds } }, include: publicServiceV2Include }),
    ]);
    const needMap = new Map(needs.map((item) => [item.id, item]));
    const serviceMap = new Map(services.map((item) => [item.id, item]));
    const now = new Date();

    return favorites.map((favorite) => {
      const targetPublicId = `v2:${favorite.targetId}`;
      if (favorite.targetKind === "NEED") {
        const need = needMap.get(favorite.targetId);
        if (!need) return { favoriteId: favorite.id, targetPublicId, kind: "NEED" as const, availability: "MISSING" as const, displayStatus: "MISSING", item: null, isOwner: false, createdAt: favorite.createdAt };
        const item = toPublicNeedV2Dto(need, null);
        return {
          favoriteId: favorite.id,
          targetPublicId,
          kind: "NEED" as const,
          availability: needFavoriteAvailability(need, now),
          displayStatus: need.state === "OPEN" && need.endsAt <= now ? "EXPIRED" : need.state,
          item,
          isOwner: item.owner.id === ctx.session.user.id,
          createdAt: favorite.createdAt,
        };
      }
      const service = serviceMap.get(favorite.targetId);
      if (!service) return { favoriteId: favorite.id, targetPublicId, kind: "SERVICE" as const, availability: "MISSING" as const, item: null, isOwner: false, createdAt: favorite.createdAt };
      return {
        favoriteId: favorite.id,
        targetPublicId,
        kind: "SERVICE" as const,
        availability: serviceFavoriteAvailability({ active: service.state === "ACTIVE", archivedAt: service.archivedAt, providerAccepting: service.serviceProfile.isAccepting }),
        item: toPublicServiceV2MarketplaceDto(service, null),
        isOwner: false,
        createdAt: favorite.createdAt,
      };
    });
  }),
});
