import type { Prisma } from "@prisma/client";

import type { NotificationResourceKind, NotificationType } from "@/domain/notification/notification";

export async function createNotificationEvent(
  tx: Prisma.TransactionClient,
  input: {
    eventKey: string;
    recipientId: string;
    actorId?: string | null;
    type: NotificationType;
    resourceKind: NotificationResourceKind;
    resourceId: string;
    subject: string;
  },
) {
  if (input.recipientId === input.actorId) return null;
  const notification = await tx.notificationV2.upsert({
    where: { eventKey: input.eventKey },
    update: {},
    create: {
      eventKey: input.eventKey,
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      resourceKind: input.resourceKind,
      resourceId: input.resourceId,
      subject: input.subject,
    },
    select: { id: true },
  });
  const recipient = await tx.user.findFirst({
    where: {
      id: input.recipientId,
      email: { not: null },
      emailVerified: { not: null },
      OR: [
        { notificationPreference: { is: null } },
        { notificationPreference: { is: { emailInstant: true } } },
      ],
    },
    select: { profile: { select: { preferredLocale: true } } },
  });
  if (recipient) {
    await tx.emailOutboxV2.upsert({
      where: { notificationId: notification.id },
      update: {},
      create: {
        notificationId: notification.id,
        recipientId: input.recipientId,
        locale: recipient.profile?.preferredLocale ?? "ja",
      },
    });
  }
  return notification;
}
