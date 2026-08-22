import type { PrismaClient } from "@prisma/client";

import { buildNotificationEmail, retryDelayMilliseconds } from "@/domain/notification/email-template";
import { notificationTypes, type NotificationLocale, type NotificationType } from "@/domain/notification/notification";
import { emailOutboxEnabled } from "@/server/feature-flags/publishing-v2";

function locale(value: string): NotificationLocale {
  return value === "zh" || value === "en" ? value : "ja";
}

function type(value: string): NotificationType {
  return notificationTypes.includes(value as NotificationType) ? value as NotificationType : "MESSAGE_RECEIVED";
}

export async function processEmailOutboxBatch(
  prisma: PrismaClient,
  input: {
    send: (message: { to: string; subject: string; html: string }) => Promise<void>;
    baseUrl: string;
    now?: Date;
    limit?: number;
  },
) {
  if (!emailOutboxEnabled()) return { inspected: 0, sent: 0, failed: 0, cancelled: 0 };
  const now = input.now ?? new Date();
  const staleBefore = new Date(now.getTime() - 10 * 60_000);
  await prisma.emailOutboxV2.updateMany({
    where: { state: "PROCESSING", lockedAt: { lt: staleBefore }, attempts: { lt: 5 } },
    data: { state: "FAILED", lockedAt: null, availableAt: now, lastErrorCode: "STALE_LOCK_RECOVERED" },
  });
  const candidates = await prisma.emailOutboxV2.findMany({
    where: { state: { in: ["PENDING", "FAILED"] }, attempts: { lt: 5 }, availableAt: { lte: now } },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: Math.min(100, input.limit ?? 20),
    select: { id: true, state: true, attempts: true },
  });
  let sent = 0;
  let failed = 0;
  let cancelled = 0;
  for (const candidate of candidates) {
    const claimed = await prisma.emailOutboxV2.updateMany({
      where: { id: candidate.id, state: candidate.state, attempts: candidate.attempts, availableAt: { lte: now } },
      data: { state: "PROCESSING", lockedAt: now },
    });
    if (claimed.count !== 1) continue;
    const job = await prisma.emailOutboxV2.findUnique({
      where: { id: candidate.id },
      include: {
        notification: { select: { type: true } },
        recipient: { select: { email: true, emailVerified: true, profile: { select: { preferredLocale: true } }, notificationPreference: { select: { emailInstant: true } } } },
      },
    });
    if (!job?.recipient.email || !job.recipient.emailVerified || job.recipient.notificationPreference?.emailInstant === false) {
      await prisma.emailOutboxV2.updateMany({ where: { id: candidate.id, state: "PROCESSING", lockedAt: now }, data: { state: "CANCELLED", lockedAt: null, lastErrorCode: "RECIPIENT_INELIGIBLE" } });
      cancelled += 1;
      continue;
    }
    const message = buildNotificationEmail({ type: type(String(job.notification.type)), locale: locale(job.locale || job.recipient.profile?.preferredLocale || "ja"), baseUrl: input.baseUrl });
    try {
      await input.send({ to: job.recipient.email, ...message });
      await prisma.emailOutboxV2.updateMany({ where: { id: candidate.id, state: "PROCESSING", lockedAt: now }, data: { state: "SENT", attempts: { increment: 1 }, lockedAt: null, sentAt: new Date(), lastErrorCode: null } });
      sent += 1;
    } catch {
      const nextAttempt = candidate.attempts + 1;
      await prisma.emailOutboxV2.updateMany({
        where: { id: candidate.id, state: "PROCESSING", lockedAt: now },
        data: { state: "FAILED", attempts: { increment: 1 }, lockedAt: null, availableAt: new Date(now.getTime() + retryDelayMilliseconds(nextAttempt)), lastErrorCode: "SEND_FAILED" },
      });
      failed += 1;
    }
  }
  return { inspected: candidates.length, sent, failed, cancelled };
}
