import { router, protectedProcedure } from "@/server/trpc/trpc";
import { baseInfoSchema } from "@/lib/zod/serviceProfile";
import { useId } from "react";
import { z } from "zod";

export const serviceProfileRouter = router({
  // 当前用户的 profile + services 一起取回
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id;
    const [profile, serviceProfile] = await Promise.all([
      ctx.prisma.profile.findUnique({ where: { userId } }),
      ctx.prisma.serviceProfile.findUnique({
        where: { userId },
        include: {
          services: {
            include: {
              priceRules: true,
              photos: {
                where: { status: 1 },
                orderBy: {
                  order: "asc",
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
    ]);
    if (!profile) {
      throw new Error("プロフィール情報が見つかりません。NOT_FOUND");
    }
    return { profile, serviceProfile };
  }),
  getLocationAndCurrency: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id;
    const serviceProfile = await ctx.prisma.serviceProfile.findUnique({
      where: { userId },
      select: {
        baseAreaRaw: true,
        baseLat: true,
        baseLon: true,
        baseCurrency: true,
      },
    });

    // if (!serviceProfile) {
    //   throw new Error({ code: "NOT_FOUND", message: "ServiceProfileが存在しません" });
    // }
    return serviceProfile;
  }),
  toggleSitterStatus: protectedProcedure
    .input(z.object({ active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user?.id!;
      // 1. isSitter = true
      return await ctx.prisma.$transaction(async (tx) => {
        const profile = await tx.profile.update({
          where: { userId },
          data: { isSitter: input.active },
        });
        if (input.active) {
          await tx.serviceProfile.upsert({
            where: { userId },
            update: {},
            create: { userId },
          });
        }
        return profile;
      });
    }),
  updateInfo: protectedProcedure
    .input(baseInfoSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const serviceProfile = await ctx.prisma.serviceProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!serviceProfile) {
        throw new Error("ServiceProfileが存在しません");
      }
      const profile = await ctx.prisma.serviceProfile.update({
        where: { userId },
        data: {
          baseAreaRaw: input.baseAreaRaw,
          baseLat: input.baseLat,
          baseLon: input.baseLon,
          baseCurrency: input.baseCurrency,
          introduction: input.introduction,
          monthsExperience: input.monthsExperience,
        },
      });

      return profile;
    }),
});
