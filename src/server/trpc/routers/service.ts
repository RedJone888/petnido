import { router, protectedProcedure } from "@/server/trpc/trpc";
import {
  serviceCreateSchema,
  serviceUpdateSchema,
  serviceDeleteSchema,
} from "@/lib/zod/services";
import { inferPetTypesFromPriceRules } from "@/domain/pet/inferPetTypes";
import { ServicePhotoKind } from "@prisma/client";
import { linkPhotos, syncPhotos } from "@/server/lib/photos";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { legacyServiceCommandSchema } from "@/lib/zod/resource-commands";
import { transitionService } from "@/domain/service/state-machine";
import { DomainTransitionError } from "@/domain/shared/state-machine";
import {
  requireOwnedService,
  requireOwnedServiceProfile,
} from "@/server/domains/resource-ownership";

export const serviceRouter = router({
  createService: protectedProcedure
    .input(serviceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id!;
      const serviceProfile = await requireOwnedServiceProfile(
        ctx.prisma,
        userId,
      );
      const {
        experiencePhotoIds,
        homePhotoIds,
        priceRules,
        availableFrom,
        availableTo,
        isActive: _requestedInitialState,
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
            isActive: true,
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
          userId,
          photoIds: experiencePhotoIds,
          serviceId: newService.id,
          serviceKind: ServicePhotoKind.EXPERIENCE,
        });
        await linkPhotos({
          tx,
          userId,
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
      const userId = ctx.session.user.id;
      const {
        serviceId,
        experiencePhotoIds,
        homePhotoIds,
        priceRules,
        availableFrom,
        availableTo,
        isActive: _requestedState,
        ...rest
      } = input;

      const petTypes = priceRules
        ? inferPetTypesFromPriceRules(priceRules)
        : undefined;
      return ctx.prisma.$transaction(async (tx) => {
        await requireOwnedService(tx, serviceId, userId);
        // 第一步：更新 Service 本体 (不含 Photos)
        const updatedCount = await tx.service.updateMany({
          where: {
            id: serviceId,
            archivedAt: null,
            serviceProfile: { userId },
          },
          data: {
            ...rest,
            availableFrom: availableFrom ? new Date(availableFrom) : undefined,
            availableTo: availableTo ? new Date(availableTo) : undefined,
            petTypes,
          },
        });
        if (updatedCount.count !== 1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "RESOURCE_NOT_FOUND",
          });
        }
        if (priceRules) {
          await tx.priceRule.deleteMany({ where: { serviceId } });
          await tx.priceRule.createMany({
            data: priceRules.map(({ groupLabel, price }) => ({
              serviceId,
              groupLabel,
              price: Number(price),
            })),
          });
        }
        // 第二步：同步图片
        await syncPhotos({
          tx,
          userId,
          photoIds: experiencePhotoIds ?? [],
          serviceId,
          serviceKind: ServicePhotoKind.EXPERIENCE,
        });
        await syncPhotos({
          tx,
          userId,
          photoIds: homePhotoIds ?? [],
          serviceId,
          serviceKind: ServicePhotoKind.HOME,
        });
        return tx.service.findUniqueOrThrow({
          where: { id: serviceId },
          include: { priceRules: true },
        });
      });
    }),
  executeCommand: protectedProcedure
    .input(legacyServiceCommandSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        const service = await requireOwnedService(tx, input.id, userId);
        const currentState = service.isActive ? "ACTIVE" : "PAUSED";
        let nextState;
        try {
          nextState = transitionService(currentState, input.command);
        } catch (error) {
          if (error instanceof DomainTransitionError) {
            throw new TRPCError({
              code: "CONFLICT",
              message: error.code,
              cause: error,
            });
          }
          throw error;
        }

        const updated = await tx.service.updateMany({
          where: {
            id: input.id,
            archivedAt: null,
            serviceProfile: { userId },
            isActive: service.isActive,
          },
          data: { isActive: nextState === "ACTIVE" },
        });
        if (updated.count !== 1) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CONFLICTING_UPDATE",
          });
        }
        return tx.service.findUniqueOrThrow({ where: { id: input.id } });
      });
    }),
  deleteService: protectedProcedure
    .input(serviceDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const { serviceId } = input;
      const userId = ctx.session.user.id;
      return ctx.prisma.$transaction(async (tx) => {
        await requireOwnedService(tx, serviceId, userId);
        const archived = await tx.service.updateMany({
          where: {
            id: serviceId,
            archivedAt: null,
            serviceProfile: { userId },
          },
          data: { archivedAt: new Date(), isActive: false },
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
      const userId = ctx.session.user.id;
      await requireOwnedService(ctx.prisma, input.id, userId);
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
