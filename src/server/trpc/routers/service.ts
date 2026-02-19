import { router, protectedProcedure } from "@/server/trpc/trpc";
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  serviceToggleSchema,
  serviceDeleteSchema,
} from "@/lib/zod/services";
import { inferPetTypesFromPriceRules } from "@/domain/pet/inferPetTypes";
import { ServicePhotoKind } from "@prisma/client";
import { linkPhotos, syncPhotos } from "@/server/lib/photos";
import { z } from "zod";

export const serviceRouter = router({
  createService: protectedProcedure
    .input(serviceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id!;
      const serviceProfile = await ctx.prisma.serviceProfile.findUnique({
        where: { userId },
      });
      if (!serviceProfile) {
        throw new Error("ServiceProfileが存在しません");
      }
      const {
        experiencePhotoIds,
        homePhotoIds,
        priceRules,
        availableFrom,
        availableTo,
        ...serviceData
      } = input;
      const petTypes = inferPetTypesFromPriceRules(priceRules);
      return ctx.prisma.$transaction(async (tx) => {
        // --- 第一步：创建 Service ---
        const newService = await tx.service.create({
          data: {
            serviceProfileId: serviceProfile.id,
            availableFrom: availableFrom ? new Date(availableFrom) : null,
            availableTo: availableTo ? new Date(availableTo) : null,
            ...serviceData,
            petTypes,
            priceRules: {
              create: priceRules.map(({ groupLabel, price }) => ({
                groupLabel,
                price: Number(price),
              })),
            },
          },
          include: {
            priceRules: true,
          },
        });
        // --- 第二步：分别认领图片，独立计数 ---
        await linkPhotos({
          tx,
          photoIds: experiencePhotoIds,
          serviceId: newService.id,
          serviceKind: ServicePhotoKind.EXPERIENCE,
        });
        await linkPhotos({
          tx,
          photoIds: homePhotoIds,
          serviceId: newService.id,
          serviceKind: ServicePhotoKind.HOME,
        });

        return newService;
      });
    }),
  updateService: protectedProcedure
    .input(serviceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        serviceId,
        experiencePhotoIds,
        homePhotoIds,
        priceRules,
        availableFrom,
        availableTo,
        ...rest
      } = input;

      const petTypes = priceRules
        ? inferPetTypesFromPriceRules(priceRules)
        : undefined;
      return ctx.prisma.$transaction(async (tx) => {
        // 第一步：更新 Service 本体 (不含 Photos)
        const updatedService = await tx.service.update({
          where: { id: serviceId },
          data: {
            ...rest,
            availableFrom: availableFrom ? new Date(availableFrom) : undefined,
            availableTo: availableTo ? new Date(availableTo) : undefined,
            petTypes,
            priceRules: priceRules
              ? {
                  deleteMany: {},
                  create: priceRules,
                }
              : undefined,
          },
          include: {
            priceRules: true,
          },
        });
        // 第二步：同步图片
        await syncPhotos({
          tx,
          photoIds: experiencePhotoIds ?? [],
          serviceId,
          serviceKind: ServicePhotoKind.EXPERIENCE,
        });
        await syncPhotos({
          tx,
          photoIds: homePhotoIds ?? [],
          serviceId,
          serviceKind: ServicePhotoKind.HOME,
        });
        return updatedService;
      });
    }),
  toggleActive: protectedProcedure
    .input(serviceToggleSchema)
    .mutation(async ({ ctx, input }) => {
      const { serviceId, isActive } = input;
      return ctx.prisma.service.update({
        where: { id: serviceId },
        data: { isActive },
      });
    }),
  deleteService: protectedProcedure
    .input(serviceDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const { serviceId } = input;
      return ctx.prisma.$transaction(async (tx) => {
        // 第一步：处理关联图片 (核心步骤)
        await tx.attachment.updateMany({
          where: { serviceId },
          data: {
            status: 2,
            serviceId: null,
          },
        });
        // 第二步：删除价格规则
        await tx.priceRule.deleteMany({ where: { serviceId } });
        // 第三步：物理删除 Service
        await tx.service.delete({ where: { id: serviceId } });
        return { success: true };
      });
    }),
  // listMine: protectedProcedure.query(async ({ ctx }) => {
  //   const userId = ctx.session.user?.id;
  //   const serviceProfile = await prisma.serviceProfile.findUnique({
  //     where: { userId },
  //     select: { id: true },
  //   });
  //   if (!serviceProfile) return { services: [] as any[] };
  //   const services = await prisma.service.findMany({
  //     where: { serviceProfileId: serviceProfile.id },
  //     include: { priceRules: true, photos: true },
  //     orderBy: { createdAt: "desc" },
  //   });
  //   return {
  //     services: services.map((s) => ({
  //       ...s,
  //       experiencePhotosCount: s.photos.filter((p) => p.kind === "EXPERIENCE")
  //         .length,
  //       homePhotosCount: s.photos.filter((p) => p.kind === "HOME").length,
  //     })),
  //   };
  // }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.prisma.service.findUnique({
        where: { id: input.id },
        include: {
          priceRules: true,
          photos: {
            where: { status: 1 },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
      return service;
    }),
});
