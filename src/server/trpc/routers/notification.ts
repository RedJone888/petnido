import { TRPCError } from "@trpc/server";
import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

import {
  notificationResourceAuthorized,
  notificationResourceHref,
  type NotificationResourceKind,
} from "@/domain/notification/notification";
import { protectedProcedure, router } from "@/server/trpc/trpc";

type NotificationRecord = {
  id: string;
  resourceKind: NotificationResourceKind;
  resourceId: string;
};
type Database = PrismaClient | Prisma.TransactionClient;

async function authorizationSets(
  prisma: Database,
  userId: string,
  notifications: NotificationRecord[],
) {
  const ids = (kind: NotificationResourceKind) => notifications.filter((item) => item.resourceKind === kind).map((item) => item.resourceId);
  const [conversations, applications, bookings] = await Promise.all([
    prisma.conversationParticipantV2.findMany({
      where: { userId, conversationId: { in: ids("CONVERSATION") } }, select: { conversationId: true },
    }),
    prisma.needApplicationV2.findMany({
      where: { id: { in: ids("APPLICATION") }, OR: [{ ownerId: userId }, { applicantId: userId }] }, select: { id: true },
    }),
    prisma.serviceBookingV2.findMany({
      where: { id: { in: ids("BOOKING") }, OR: [{ providerId: userId }, { customerId: userId }] }, select: { id: true },
    }),
  ]);
  return {
    CONVERSATION: new Set(conversations.map((item) => item.conversationId)),
    APPLICATION: new Set(applications.map((item) => item.id)),
    BOOKING: new Set(bookings.map((item) => item.id)),
  };
}

async function assertAuthorized(
  prisma: Database,
  userId: string,
  notification: NotificationRecord,
) {
  const authorized = await authorizationSets(prisma, userId, [notification]);
  if (!notificationResourceAuthorized(notification, authorized)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "FORBIDDEN_RESOURCE_ACTION" });
  }
}

export const notificationRouter = router({
  unreadCount: protectedProcedure.query(({ ctx }) => ctx.prisma.notificationV2.count({
    where: { recipientId: ctx.session.user.id, readAt: null },
  })),

  listMine: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(30), unreadOnly: z.boolean().default(false) }).strict().default({ limit: 30, unreadOnly: false }))
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.prisma.notificationV2.findMany({
        where: { recipientId: ctx.session.user.id, ...(input.unreadOnly ? { readAt: null } : {}) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit,
        select: { id: true, type: true, resourceKind: true, resourceId: true, subject: true, readAt: true, createdAt: true },
      });
      const authorized = await authorizationSets(ctx.prisma, ctx.session.user.id, notifications);
      return notifications.flatMap((notification) => notificationResourceAuthorized(notification, authorized)
        ? [{ ...notification, href: notificationResourceHref(notification.resourceKind, notification.resourceId), read: notification.readAt !== null }]
        : []);
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(128) }).strict())
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notificationV2.findFirst({
        where: { id: input.id, recipientId: ctx.session.user.id },
        select: { id: true, resourceKind: true, resourceId: true },
      });
      if (!notification) throw new TRPCError({ code: "NOT_FOUND", message: "RESOURCE_NOT_FOUND" });
      await assertAuthorized(ctx.prisma, ctx.session.user.id, notification);
      await ctx.prisma.notificationV2.updateMany({ where: { id: notification.id, recipientId: ctx.session.user.id, readAt: null }, data: { readAt: new Date() } });
      return { read: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.prisma.notificationV2.updateMany({
      where: { recipientId: ctx.session.user.id, readAt: null }, data: { readAt: new Date() },
    });
    return { count: updated.count };
  }),
});
