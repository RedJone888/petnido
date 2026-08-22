import type { Prisma, PrismaClient } from "@prisma/client";

import type { ConversationContextTarget } from "@/domain/messaging/conversation";
import { appendSystemMessage, ensureConversationWithUserMessage, resolveConsultationTarget } from "@/server/domains/messaging/conversation-v2";
import { createNotificationEvent } from "@/server/domains/notification/notification-v2";

export type ApplicationCommandErrorCode = "RESOURCE_NOT_FOUND" | "FORBIDDEN_RESOURCE_ACTION" | "INVALID_STATE_TRANSITION" | "CONFLICTING_UPDATE" | "IDEMPOTENCY_KEY_REUSED";

export class ApplicationCommandError extends Error {
  constructor(public readonly code: ApplicationCommandErrorCode) {
    super(code);
  }
}

async function claimOpenNeed(
  tx: Prisma.TransactionClient,
  application: { needSource: "V2" | "LEGACY"; needId: string; ownerId: string },
  now: Date,
) {
  if (application.needSource === "V2") {
    return tx.needV2.updateMany({
      where: { id: application.needId, ownerId: application.ownerId, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
      data: { state: "MATCHED" },
    });
  }
  return tx.need.updateMany({
    where: { id: application.needId, ownerId: application.ownerId, status: "OPEN", archivedAt: null, endDate: { gt: now } },
    data: { status: "MATCHED" },
  });
}

async function reopenNeedIfPossible(
  tx: Prisma.TransactionClient,
  application: { needSource: "V2" | "LEGACY"; needId: string; ownerId: string },
  now: Date,
) {
  if (application.needSource === "V2") {
    const reopened = await tx.needV2.updateMany({
      where: { id: application.needId, ownerId: application.ownerId, state: "MATCHED", archivedAt: null, endsAt: { gt: now } },
      data: { state: "OPEN" },
    });
    if (!reopened.count) {
      await tx.needV2.updateMany({ where: { id: application.needId, ownerId: application.ownerId, state: "MATCHED", endsAt: { lte: now } }, data: { state: "CLOSED" } });
    }
    return reopened.count > 0;
  }
  const reopened = await tx.need.updateMany({
    where: { id: application.needId, ownerId: application.ownerId, status: "MATCHED", archivedAt: null, endDate: { gt: now } },
    data: { status: "OPEN" },
  });
  if (!reopened.count) {
    await tx.need.updateMany({ where: { id: application.needId, ownerId: application.ownerId, status: "MATCHED", endDate: { lte: now } }, data: { status: "CLOSED" } });
  }
  return reopened.count > 0;
}

export async function createNeedApplication(
  prisma: PrismaClient,
  input: { actorId: string; target: ConversationContextTarget; body: string; idempotencyKey: string; now?: Date },
) {
  if (input.target.kind !== "NEED") throw new ApplicationCommandError("RESOURCE_NOT_FOUND");
  return prisma.$transaction(async (tx) => {
    const byKey = await tx.needApplicationV2.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (byKey) {
      if (byKey.applicantId !== input.actorId || byKey.needSource !== input.target.source || byKey.needId !== input.target.contextId) {
        throw new ApplicationCommandError("IDEMPOTENCY_KEY_REUSED");
      }
      return { applicationId: byKey.id, conversationId: byKey.conversationId, state: byKey.state, alreadyExists: true };
    }
    const existing = await tx.needApplicationV2.findUnique({
      where: { needSource_needId_applicantId: { needSource: input.target.source, needId: input.target.contextId, applicantId: input.actorId } },
    });
    if (existing) return { applicationId: existing.id, conversationId: existing.conversationId, state: existing.state, alreadyExists: true };

    const resolved = await resolveConsultationTarget(tx, input.target, input.actorId, input.now);
    const conversation = await ensureConversationWithUserMessage(tx, {
      actorId: input.actorId,
      counterpartId: resolved.counterpartId,
      target: input.target,
      contextTitle: resolved.contextTitle,
      contextMode: resolved.contextMode,
      body: input.body,
      clientMessageId: input.idempotencyKey,
    });
    const application = await tx.needApplicationV2.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        needSource: input.target.source,
        needId: input.target.contextId,
        needTitleSnapshot: resolved.contextTitle,
        needModeSnapshot: resolved.contextMode,
        ownerId: resolved.counterpartId,
        applicantId: input.actorId,
        conversationId: conversation.conversationId,
      },
      select: { id: true, state: true },
    });
    await createNotificationEvent(tx, {
      eventKey: `application:${application.id}:received`, recipientId: resolved.counterpartId, actorId: input.actorId,
      type: "APPLICATION_RECEIVED", resourceKind: "APPLICATION", resourceId: application.id, subject: resolved.contextTitle,
    });
    return { applicationId: application.id, conversationId: conversation.conversationId, state: application.state, alreadyExists: false };
  });
}

export async function acceptNeedApplication(
  prisma: PrismaClient,
  input: { ownerId: string; applicationId: string; now?: Date },
) {
  const now = input.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const application = await tx.needApplicationV2.findFirst({ where: { id: input.applicationId, ownerId: input.ownerId } });
    if (!application) throw new ApplicationCommandError("RESOURCE_NOT_FOUND");
    if (application.state === "ACCEPTED") return { applicationId: application.id, state: application.state, needReopened: false };
    if (application.state !== "PENDING") throw new ApplicationCommandError("INVALID_STATE_TRANSITION");
    const claimed = await claimOpenNeed(tx, application, now);
    if (claimed.count !== 1) throw new ApplicationCommandError("CONFLICTING_UPDATE");
    const accepted = await tx.needApplicationV2.updateMany({
      where: { id: application.id, ownerId: input.ownerId, state: "PENDING" },
      data: { state: "ACCEPTED", decidedAt: now },
    });
    if (accepted.count !== 1) throw new ApplicationCommandError("CONFLICTING_UPDATE");
    const ended = await tx.needApplicationV2.findMany({
      where: { needSource: application.needSource, needId: application.needId, id: { not: application.id }, state: "PENDING" },
      select: { id: true, conversationId: true },
    });
    await tx.needApplicationV2.updateMany({
      where: { id: { in: ended.map((item) => item.id) }, state: "PENDING" },
      data: { state: "NEED_ENDED", decidedAt: now },
    });
    await appendSystemMessage(tx, { conversationId: application.conversationId, systemCode: "APPLICATION_ACCEPTED", body: "The pet owner accepted this application.", clientMessageId: `application:${application.id}:accepted` });
    await Promise.all([
      createNotificationEvent(tx, {
        eventKey: `application:${application.id}:accepted`, recipientId: application.applicantId, actorId: input.ownerId,
        type: "APPLICATION_ACCEPTED", resourceKind: "APPLICATION", resourceId: application.id, subject: application.needTitleSnapshot,
      }),
      createNotificationEvent(tx, {
        eventKey: `need:${application.needSource}:${application.needId}:matched:${application.id}`, recipientId: input.ownerId,
        type: "NEED_MATCHED", resourceKind: "APPLICATION", resourceId: application.id, subject: application.needTitleSnapshot,
      }),
    ]);
    for (const item of ended) {
      await appendSystemMessage(tx, { conversationId: item.conversationId, systemCode: "APPLICATION_NEED_ENDED", body: "This need selected another provider.", clientMessageId: `application:${item.id}:need-ended` });
      const endedApplication = await tx.needApplicationV2.findUnique({ where: { id: item.id }, select: { applicantId: true } });
      if (endedApplication) await createNotificationEvent(tx, {
        eventKey: `application:${item.id}:need-ended`, recipientId: endedApplication.applicantId, actorId: input.ownerId,
        type: "APPLICATION_NEED_ENDED", resourceKind: "APPLICATION", resourceId: item.id, subject: application.needTitleSnapshot,
      });
    }
    return { applicationId: application.id, state: "ACCEPTED" as const, needReopened: false };
  });
}

export async function declineNeedApplication(
  prisma: PrismaClient,
  input: { ownerId: string; applicationId: string; now?: Date },
) {
  const now = input.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const application = await tx.needApplicationV2.findFirst({ where: { id: input.applicationId, ownerId: input.ownerId } });
    if (!application) throw new ApplicationCommandError("RESOURCE_NOT_FOUND");
    if (application.state === "DECLINED") return { applicationId: application.id, state: application.state };
    if (application.state !== "PENDING") throw new ApplicationCommandError("INVALID_STATE_TRANSITION");
    await tx.needApplicationV2.update({ where: { id: application.id }, data: { state: "DECLINED", decidedAt: now } });
    await appendSystemMessage(tx, { conversationId: application.conversationId, systemCode: "APPLICATION_DECLINED", body: "The pet owner declined this application.", clientMessageId: `application:${application.id}:declined` });
    await createNotificationEvent(tx, {
      eventKey: `application:${application.id}:declined`, recipientId: application.applicantId, actorId: input.ownerId,
      type: "APPLICATION_DECLINED", resourceKind: "APPLICATION", resourceId: application.id, subject: application.needTitleSnapshot,
    });
    return { applicationId: application.id, state: "DECLINED" as const };
  });
}

export async function cancelNeedApplication(
  prisma: PrismaClient,
  input: { actorId: string; applicationId: string; now?: Date },
) {
  const now = input.now ?? new Date();
  return prisma.$transaction(async (tx) => {
    const application = await tx.needApplicationV2.findUnique({ where: { id: input.applicationId } });
    if (!application) throw new ApplicationCommandError("RESOURCE_NOT_FOUND");
    const isApplicant = application.applicantId === input.actorId;
    const isOwner = application.ownerId === input.actorId;
    if (!isApplicant && !isOwner) throw new ApplicationCommandError("FORBIDDEN_RESOURCE_ACTION");
    if (application.state === "CANCELLED") return { applicationId: application.id, state: application.state, needReopened: false };
    if (application.state !== "PENDING" && application.state !== "ACCEPTED") throw new ApplicationCommandError("INVALID_STATE_TRANSITION");
    if (isOwner && application.state !== "ACCEPTED") throw new ApplicationCommandError("INVALID_STATE_TRANSITION");
    await tx.needApplicationV2.update({ where: { id: application.id }, data: { state: "CANCELLED", cancelledAt: now } });
    const needReopened = application.state === "ACCEPTED" ? await reopenNeedIfPossible(tx, application, now) : false;
    await appendSystemMessage(tx, {
      conversationId: application.conversationId,
      systemCode: isOwner ? "APPLICATION_PROVIDER_REMOVED" : "APPLICATION_CANCELLED",
      body: isOwner ? "The pet owner cancelled the selected provider." : "The applicant cancelled this application.",
      clientMessageId: `application:${application.id}:cancelled`,
    });
    const counterpartId = isOwner ? application.applicantId : application.ownerId;
    await createNotificationEvent(tx, {
      eventKey: `application:${application.id}:cancelled:${input.actorId}`, recipientId: counterpartId, actorId: input.actorId,
      type: "APPLICATION_CANCELLED", resourceKind: "APPLICATION", resourceId: application.id, subject: application.needTitleSnapshot,
    });
    if (application.state === "ACCEPTED") {
      await createNotificationEvent(tx, {
        eventKey: `need:${application.needSource}:${application.needId}:${needReopened ? "reopened" : "closed"}:${application.id}`,
        recipientId: application.ownerId,
        type: needReopened ? "NEED_REOPENED" : "NEED_CLOSED",
        resourceKind: "APPLICATION", resourceId: application.id, subject: application.needTitleSnapshot,
      });
    }
    return { applicationId: application.id, state: "CANCELLED" as const, needReopened };
  });
}
