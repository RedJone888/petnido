import { TRPCError } from "@trpc/server";
import { notificationPreferenceUpdateSchema } from "@/lib/zod/notification-preference";
import { protectedProcedure, router } from "@/server/trpc/trpc";

export const notificationPreferenceRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { email: true, emailVerified: true, notificationPreference: { select: { emailInstant: true, updatedAt: true } } },
    });
    return {
      emailInstant: user?.notificationPreference?.emailInstant ?? false,
      updatedAt: user?.notificationPreference?.updatedAt ?? null,
      hasEmail: Boolean(user?.email),
      emailVerified: Boolean(user?.emailVerified),
      canEnableEmail: Boolean(user?.email && user.emailVerified),
    };
  }),

  updateMine: protectedProcedure
    .input(notificationPreferenceUpdateSchema)
    .mutation(async ({ ctx, input }) => ctx.prisma.$transaction(async (tx) => {
      const userId = ctx.session.user.id;
      if (input.emailInstant) {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
        if (!user?.email || !user.emailVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "EMAIL_VERIFICATION_REQUIRED" });
      }
      const preference = await tx.notificationPreference.upsert({
        where: { userId }, update: input, create: { userId, ...input }, select: { emailInstant: true, updatedAt: true },
      });
      if (!input.emailInstant) {
        await tx.emailOutboxV2.updateMany({
          where: { recipientId: userId, state: { in: ["PENDING", "FAILED"] } },
          data: { state: "CANCELLED", lastErrorCode: "USER_UNSUBSCRIBED" },
        });
      }
      return preference;
    })),
});
