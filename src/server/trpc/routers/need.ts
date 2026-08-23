import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/trpc";
import { needCreateSchema, needUpdateSchema } from "@/lib/zod/needs";
import { linkPhotos, syncPhotos } from "@/server/lib/photos";
import { z } from "zod";
import { NeedStatus, PetType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  listUserNeeds,
  listBrowseNeeds,
} from "@/server/domains/needs/queries";
import { legacyNeedCommandSchema } from "@/lib/zod/resource-commands";
import { requireOwnedNeed } from "@/server/domains/resource-ownership";

// The legacy Need table retains its historical CANCELLED status. NeedV2 uses
// the published-only state machine in domain/need/state-machine instead.
const legacyNeedTransitions: Readonly<
  Record<NeedStatus, Readonly<Partial<Record<"CLOSE" | "REOPEN" | "CANCEL", NeedStatus>>>>
> = {
  OPEN: { CLOSE: "CLOSED", CANCEL: "CANCELLED" },
  MATCHED: { CLOSE: "CLOSED", REOPEN: "OPEN", CANCEL: "CANCELLED" },
  CLOSED: { REOPEN: "OPEN", CANCEL: "CANCELLED" },
  CANCELLED: {},
};

export const needRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // await ctx.prisma.need.updateMany({
    //   where: { ownerId: userId, status: "OPEN", endDate: { lt: new Date() } },
    //   data: { status: "CLOSED" },
    // });
    return listUserNeeds(userId);
    // const needs = await ctx.prisma.need.findMany({
    //   where: { ownerId: userId },
    //   select: {
    //     id: true,
    //     title: true,
    //     status: true,
    //     startDate: true,
    //     endDate: true,
    //     frequencyType: true,
    //     customDays: true,
    //     customTimes: true,
    //     fosterRange: true,
    //     transportMethod: true,
    //     addressRaw: true,
    //     totalPrice: true,
    //     priceAmount: true,
    //     currency: true,
    //     category: true,
    //     photos: {
    //       where: { status: 1 },
    //       orderBy: { order: "asc" },
    //       take: 1,
    //       select: { url: true },
    //     },
    //     needPets: {
    //       select: {
    //         petCategory: true,
    //         petType: true,
    //         count: true,
    //       },
    //     },
    //   },
    //   orderBy: { createdAt: "desc" },
    // });
    // return needs;
  }),
  listAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listBrowseNeeds({ limit: input.limit ?? 50 });
      // const limit = input.limit ?? 50;
      // const needs = await ctx.prisma.need.findMany({
      //   where: { status: "OPEN", endDate: { gt: new Date() } },
      //   include: {
      //     owner: {
      //       select: {
      //         id: true,
      //         name: true,
      //         image: true,
      //       },
      //     },
      //     photos: {
      //       where: { status: 1 },
      //       orderBy: { order: "asc" },
      //     },
      //     needPets: {
      //       include: {
      //         photos: {
      //           where: { status: 1 },
      //           orderBy: { order: "asc" },
      //         },
      //       },
      //     },
      //   },
      //   orderBy: { createdAt: "desc" },
      //   take: limit,
      // });
      // return needs;
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await requireOwnedNeed(ctx.prisma, input.id, userId);
      return ctx.prisma.need.findUnique({
        where: { id: input.id },
        include: {
          photos: {
            where: { status: 1 },
            orderBy: { order: "asc" },
          },
          needPets: {
            include: {
              photos: {
                where: { status: 1 },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
    }),
  createNeed: protectedProcedure
    .input(needCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id!;
      const { photoIds, startDate, endDate, needPets, ...needData } = input;
      return ctx.prisma.$transaction(async (tx) => {
        // --- 第一步：创建 Need ---
        const newNeed = await tx.need.create({
          data: {
            ownerId: userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            ...needData,
          },
        });
        // --- 第二步：认领 Need 主表的图片 ---
        await linkPhotos({
          tx,
          userId,
          photoIds,
          needId: newNeed.id,
        });
        // --- 第三步：循环处理 NeedPetNeedPet (创建 + 认领图片) ---
        await Promise.all(
          needPets.map(async (np) => {
            const { photoIds, petCategory, ...rest } = np;
            // a. 创建子表 NeedPet 记录

            const newNeedPet = await tx.needPet.create({
              data: {
                needId: newNeed.id,
                petCategory: petCategory as PetType,
                ...rest,
              },
            });
            // b. 立即认领该宠物对应的图片
            await linkPhotos({
              tx,
              userId,
              photoIds,
              needPetId: newNeedPet.id,
            });
          }),
        );
        return newNeed;
      });
    }),
  updateNeed: protectedProcedure
    .input(needUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, photoIds, needPets, startDate, endDate, ...needData } = input;

      return ctx.prisma.$transaction(async (tx) => {
        await requireOwnedNeed(tx, id, userId);
        // 第一步：更新 Need 本体 (不含 Photos和 NeedPets)
        const updateResult = await tx.need.updateMany({
          where: { id, ownerId: userId, archivedAt: null },
          data: {
            ...needData,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          },
        });
        if (updateResult.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        // 第二步：同步图片
        await syncPhotos({
          tx,
          userId,
          photoIds: photoIds ?? [],
          needId: id,
        });
        // 获取当前数据库中所有的 needPetId，找出不再 input 列表中的进行删除
        const currentNeedPets = await tx.needPet.findMany({
          where: { needId: id },
          select: { id: true },
        });
        const inputPetIds = needPets
          .map((np) => np.id)
          .filter(Boolean) as string[];
        const needPetsToDelete = currentNeedPets
          .filter((cp) => !inputPetIds.includes(cp.id))
          .map((cp) => cp.id);
        if (needPetsToDelete.length > 0) {
          // 在删除 needPet 之前，先解绑/清理它们的图片
          await tx.attachment.updateMany({
            where: { needPetId: { in: needPetsToDelete } },
            data: { status: 2, needPetId: null },
          });
          await tx.needPet.deleteMany({
            where: { id: { in: needPetsToDelete } },
          });
        }
        if (needPets && needPets.length > 0) {
          await Promise.all(
            needPets.map(async (np) => {
              const {
                photoIds: needPetPhotoIds,
                id: needPetId,
                petCategory,
                ...rest
              } = np;
              let finalNeedPetId: string;
              if (needPetId) {
                // 修改已有宠物
                const updatedNeedPet = await tx.needPet.updateMany({
                  where: { id: needPetId, needId: id },
                  data: { petCategory: petCategory as PetType, ...rest },
                });
                if (updatedNeedPet.count !== 1) {
                  throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "RESOURCE_NOT_FOUND",
                  });
                }
                finalNeedPetId = needPetId;
              } else {
                // 新增宠物
                const newNeedPet = await tx.needPet.create({
                  data: {
                    needId: id,
                    petCategory: petCategory as PetType,
                    ...rest,
                  },
                });
                finalNeedPetId = newNeedPet.id;
              }
              // 同步该宠物的关联图片
              await syncPhotos({
                tx,
                userId,
                photoIds: needPetPhotoIds ?? [],
                needPetId: finalNeedPetId,
              });
            }),
          );
        }
        return tx.need.findUniqueOrThrow({ where: { id } });
      });
    }),
  // stats: protectedProcedure.query(async ({ ctx }) => {
  //   const userId = ctx.session!.user!.id;
  //   const [totalNeeds, completedNeeds] = await ctx.prisma.$transaction([
  //     ctx.prisma.need.count({ where: { ownerId: userId } }),
  //     ctx.prisma.need.count({ where: { ownerId: userId, status: "CLOSED" } }),
  //   ]);
  //   const reviewCount = 0;
  //   return {
  //     totalNeeds,
  //     completedNeeds,
  //     reviewCount,
  //   };
  // }),
  executeCommand: protectedProcedure
    .input(legacyNeedCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const existingNeed = await requireOwnedNeed(tx, input.id, userId);
        const nextStatus = legacyNeedTransitions[existingNeed.status][input.command];
        if (!nextStatus) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "INVALID_STATE_TRANSITION",
          });
        }

        const updated = await tx.need.updateMany({
          where: {
            id: input.id,
            ownerId: userId,
            archivedAt: null,
            status: existingNeed.status,
          },
          data: { status: NeedStatus[nextStatus] },
        });
        if (updated.count !== 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CONFLICTING_UPDATE",
          });
        }
        return tx.need.findUniqueOrThrow({ where: { id: input.id } });
      });
    }),

  deleteNeed: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        await requireOwnedNeed(tx, id, userId);
        const archived = await tx.need.updateMany({
          where: { id, ownerId: userId, archivedAt: null },
          data: { archivedAt: new Date() },
        });
        if (archived.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        return { success: true };
      });
    }),
});
