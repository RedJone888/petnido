import { notificationPreferenceUpdateSchema } from "@/lib/zod/notification-preference";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const notificationPreferenceRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const preference = await ctx.prisma.notificationPreference.findUnique({
      where: { userId: ctx.session.user.id },
      select: { emailInstant: true, updatedAt: true },
    });
    return preference ?? { emailInstant: false, updatedAt: null };
  }),

  updateMine: protectedProcedure
    .input(notificationPreferenceUpdateSchema)
    .mutation(({ ctx, input }) =>
      ctx.prisma.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        update: input,
        create: { userId: ctx.session.user.id, ...input },
        select: { emailInstant: true, updatedAt: true },
      }),
    ),
});
