import {
  protectedProcedure,
  publicProcedure,
  router,
} from "@/server/trpc/trpc";
import { needCreateSchema, needUpdateSchema } from "@/lib/zod/needs";
import { linkPhotos, syncPhotos } from "@/server/lib/photos";
import { z } from "zod";
import { NeedStatus, PetType } from "@prisma/client";

export const needRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user!.id;
    // await ctx.prisma.need.updateMany({
    //   where: { ownerId: userId, status: "OPEN", endDate: { lt: new Date() } },
    //   data: { status: "CLOSED" },
    // });
    const needs = await ctx.prisma.need.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        frequencyType: true,
        customDays: true,
        customTimes: true,
        fosterRange: true,
        transportMethod: true,
        addressRaw: true,
        totalPrice: true,
        priceAmount: true,
        currency: true,
        category: true,
        photos: {
          where: { status: 1 },
          orderBy: { order: "asc" },
          take: 1,
          select: { url: true },
        },
        needPets: {
          select: {
            petCategory: true,
            petType: true,
            count: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return needs;
  }),
  listAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const needs = await ctx.prisma.need.findMany({
        where: { status: "OPEN", endDate: { gt: new Date() } },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
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
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return needs;
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.need.findUnique({
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
            await linkPhotos({ tx, photoIds, needPetId: newNeedPet.id });
          }),
        );
      });
    }),
  updateNeed: protectedProcedure
    .input(needUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, photoIds, needPets, startDate, endDate, ...needData } = input;

      return ctx.prisma.$transaction(async (tx) => {
        // 第一步：更新 Need 本体 (不含 Photos和 NeedPets)
        const updatedNeed = await tx.need.update({
          where: { id },
          data: {
            ...needData,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          },
        });
        // 第二步：同步图片
        await syncPhotos({
          tx,
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
                const updatedNeedPet = await tx.needPet.update({
                  where: { id: needPetId },
                  data: { petCategory: petCategory as PetType, ...rest },
                });
                finalNeedPetId = updatedNeedPet.id;
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
                photoIds: needPetPhotoIds ?? [],
                needPetId: finalNeedPetId,
              });
            }),
          );
        }
        return updatedNeed;
      });
    }),
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user!.id;
    const [totalNeeds, completedNeeds] = await ctx.prisma.$transaction([
      ctx.prisma.need.count({ where: { ownerId: userId } }),
      ctx.prisma.need.count({ where: { ownerId: userId, status: "CLOSED" } }),
    ]);
    const reviewCount = 0;
    return {
      totalNeeds,
      completedNeeds,
      reviewCount,
    };
  }),
  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(NeedStatus) }))
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      const userId = ctx.session.user?.id;
      // 1. 首先确认这个 Need 是否属于当前用户
      const existingNeed = await ctx.prisma.need.findUnique({
        where: { id },
        select: { ownerId: true, status: true },
      });
      if (!existingNeed) {
        // throw new TRPCError({
        //   code: "NOT_FOUND",
        //   message: "指定された依頼が見つかりません。",
        // });
      }
      if (existingNeed?.ownerId !== userId) {
        // throw new TRPCError({
        //   code: "FORBIDDEN",
        //   message: "この操作を行う権限がありません。",
        // });
      }
      // 2. 执行更新
      const updatedNeed = await ctx.prisma.need.update({
        where: { id },
        data: {
          status,
        },
      });

      return updatedNeed;
    }),

  deleteNeed: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session.user?.id;
      const need = await ctx.prisma.need.findUnique({
        where: { id },
        select: { ownerId: true },
      });
      if (!need || need.ownerId !== userId) {
        throw new Error("FORBIDDEN");
      }
      return ctx.prisma.$transaction(async (tx) => {
        // 第一步：处理关联图片
        await tx.attachment.updateMany({
          where: { needId: id },
          data: {
            status: 2,
            needId: null,
          },
        });
        // 第二步：处理关联needPet的图片
        await tx.attachment.updateMany({
          where: {
            needPet: { needId: id },
          },
          data: { status: 2, needPetId: null },
        });
        // 第三步：物理删除子表
        await tx.needPet.deleteMany({ where: { needId: id } });
        // 第三步：物理删除主表
        await tx.need.delete({ where: { id } });
        return { success: true };
      });
    }),
});
