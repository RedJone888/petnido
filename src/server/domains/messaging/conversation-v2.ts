import type { Prisma, PrismaClient } from "@prisma/client";

import {
  conversationPairKey,
  type ConversationContextTarget,
} from "@/domain/messaging/conversation";
import { createNotificationEvent } from "@/server/domains/notification/notification-v2";
import { buildNeedDisplayTitle } from "@/modules/need-publishing/domain/display-title";

export class ConversationCommandError extends Error {
  constructor(public readonly code: "RESOURCE_NOT_FOUND" | "FORBIDDEN_RESOURCE_ACTION") {
    super(code);
  }
}

export async function resolveConsultationTarget(
  prisma: Pick<Prisma.TransactionClient, "needV2" | "need" | "serviceV2" | "service">,
  target: ConversationContextTarget,
  actorId: string,
  now = new Date(),
) {
  if (target.kind === "NEED" && target.source === "V2") {
    const need = await prisma.needV2.findFirst({
      where: { id: target.contextId, state: "OPEN", archivedAt: null, endsAt: { gt: now } },
      select: {
        ownerId: true,
        mode: true,
        pets: { select: { name: true, petType: true, customPetType: true } },
      },
    });
    if (!need) throw new ConversationCommandError("RESOURCE_NOT_FOUND");
    if (need.ownerId === actorId) throw new ConversationCommandError("FORBIDDEN_RESOURCE_ACTION");
    return {
      counterpartId: need.ownerId,
      contextTitle: buildNeedDisplayTitle({ mode: need.mode, pets: need.pets }),
      contextMode: need.mode,
    };
  }
  if (target.kind === "NEED") {
    const need = await prisma.need.findFirst({
      where: { id: target.contextId, status: "OPEN", archivedAt: null, endDate: { gt: now } },
      select: { ownerId: true, title: true, category: true },
    });
    if (!need) throw new ConversationCommandError("RESOURCE_NOT_FOUND");
    if (need.ownerId === actorId) throw new ConversationCommandError("FORBIDDEN_RESOURCE_ACTION");
    const contextMode = need.category === "VISIT" ? "HOME_VISIT" : need.category === "FOSTER" ? "BOARDING" : "CUSTOM";
    return { counterpartId: need.ownerId, contextTitle: need.title, contextMode };
  }
  if (target.source === "V2") {
    const service = await prisma.serviceV2.findFirst({
      where: { id: target.contextId, state: "ACTIVE", archivedAt: null, serviceProfile: { isAccepting: true } },
      select: { title: true, mode: true, serviceProfile: { select: { userId: true } } },
    });
    if (!service) throw new ConversationCommandError("RESOURCE_NOT_FOUND");
    if (service.serviceProfile.userId === actorId) throw new ConversationCommandError("FORBIDDEN_RESOURCE_ACTION");
    return { counterpartId: service.serviceProfile.userId, contextTitle: service.title, contextMode: service.mode };
  }
  const service = await prisma.service.findFirst({
    where: { id: target.contextId, isActive: true, archivedAt: null, serviceProfile: { isAccepting: true } },
    select: { serviceType: true, customType: true, serviceProfile: { select: { userId: true } } },
  });
  if (!service) throw new ConversationCommandError("RESOURCE_NOT_FOUND");
  if (service.serviceProfile.userId === actorId) throw new ConversationCommandError("FORBIDDEN_RESOURCE_ACTION");
  const contextMode = service.serviceType === "VISIT" ? "HOME_VISIT" : service.serviceType === "FOSTER" ? "BOARDING" : "CUSTOM";
  const contextTitle = contextMode === "CUSTOM" && service.customType ? service.customType : contextMode === "HOME_VISIT" ? "Home visit care" : "Boarding care";
  return { counterpartId: service.serviceProfile.userId, contextTitle, contextMode };
}

async function advanceConversationLastMessage(
  tx: Prisma.TransactionClient,
  conversationId: string,
  createdAt: Date,
) {
  await tx.conversationV2.updateMany({
    where: {
      id: conversationId,
      OR: [{ lastMessageAt: null }, { lastMessageAt: { lt: createdAt } }],
    },
    data: { lastMessageAt: createdAt },
  });
}

export async function ensureConversationWithUserMessage(
  tx: Prisma.TransactionClient,
  input: {
    actorId: string;
    counterpartId: string;
    target: ConversationContextTarget;
    contextTitle: string;
    contextMode: string;
    body: string;
    clientMessageId: string;
  },
) {
  const pairKey = conversationPairKey(input.actorId, input.counterpartId);
  const conversation = await tx.conversationV2.upsert({
    where: {
      contextKind_contextSource_contextId_participantPairKey: {
        contextKind: input.target.kind,
        contextSource: input.target.source,
        contextId: input.target.contextId,
        participantPairKey: pairKey,
      },
    },
    update: {},
    create: {
      contextKind: input.target.kind,
      contextSource: input.target.source,
      contextId: input.target.contextId,
      contextTitle: input.contextTitle,
      contextMode: input.contextMode,
      participantPairKey: pairKey,
      createdById: input.actorId,
    },
    select: { id: true },
  });
  await Promise.all([input.actorId, input.counterpartId].map((userId) =>
    tx.conversationParticipantV2.upsert({
      where: {
        conversationId_userId: { conversationId: conversation.id, userId },
      },
      update: {},
      create: { conversationId: conversation.id, userId },
    }),
  ));
  const message = await tx.messageV2.upsert({
    where: { conversationId_clientMessageId: { conversationId: conversation.id, clientMessageId: input.clientMessageId } },
    update: {},
    create: {
      conversationId: conversation.id,
      senderId: input.actorId,
      kind: "USER",
      body: input.body,
      clientMessageId: input.clientMessageId,
    },
    select: { id: true, createdAt: true },
  });
  await Promise.all([
    advanceConversationLastMessage(tx, conversation.id, message.createdAt),
    tx.conversationParticipantV2.update({
      where: { conversationId_userId: { conversationId: conversation.id, userId: input.actorId } },
      data: { archivedAt: null, lastReadAt: message.createdAt },
    }),
  ]);
  await createNotificationEvent(tx, {
    eventKey: `message:${message.id}:recipient:${input.counterpartId}`,
    recipientId: input.counterpartId,
    actorId: input.actorId,
    type: "MESSAGE_RECEIVED",
    resourceKind: "CONVERSATION",
    resourceId: conversation.id,
    subject: input.contextTitle,
  });
  return { conversationId: conversation.id, messageId: message.id };
}

export async function startConsultation(
  prisma: PrismaClient,
  input: {
    actorId: string;
    target: ConversationContextTarget;
    body: string;
    clientMessageId: string;
    now?: Date;
  },
) {
  return prisma.$transaction(async (tx) => {
    const resolved = await resolveConsultationTarget(tx, input.target, input.actorId, input.now);
    return ensureConversationWithUserMessage(tx, { ...input, ...resolved });
  });
}

export async function sendConversationMessage(
  prisma: PrismaClient,
  input: { actorId: string; conversationId: string; body: string; clientMessageId: string },
) {
  return prisma.$transaction(async (tx) => {
    const participant = await tx.conversationParticipantV2.findUnique({
      where: { conversationId_userId: { conversationId: input.conversationId, userId: input.actorId } },
      select: { userId: true },
    });
    if (!participant) throw new ConversationCommandError("FORBIDDEN_RESOURCE_ACTION");
    const conversation = await tx.conversationV2.findFirst({
      where: { id: input.conversationId, participants: { some: { userId: input.actorId } } },
      select: {
        contextTitle: true,
        participants: { select: { userId: true } },
      },
    });
    if (!conversation) throw new ConversationCommandError("FORBIDDEN_RESOURCE_ACTION");
    const message = await tx.messageV2.upsert({
      where: { conversationId_clientMessageId: { conversationId: input.conversationId, clientMessageId: input.clientMessageId } },
      update: {},
      create: {
        conversationId: input.conversationId,
        senderId: input.actorId,
        kind: "USER",
        body: input.body,
        clientMessageId: input.clientMessageId,
      },
      select: { id: true, createdAt: true },
    });
    await Promise.all([
      advanceConversationLastMessage(tx, input.conversationId, message.createdAt),
      tx.conversationParticipantV2.update({
        where: { conversationId_userId: { conversationId: input.conversationId, userId: input.actorId } },
        data: { archivedAt: null, lastReadAt: message.createdAt },
      }),
    ]);
    await Promise.all(conversation.participants
      .filter((item) => item.userId !== input.actorId)
      .map((item) => createNotificationEvent(tx, {
        eventKey: `message:${message.id}:recipient:${item.userId}`,
        recipientId: item.userId,
        actorId: input.actorId,
        type: "MESSAGE_RECEIVED",
        resourceKind: "CONVERSATION",
        resourceId: input.conversationId,
        subject: conversation.contextTitle,
      })));
    return { conversationId: input.conversationId, messageId: message.id };
  });
}

export async function appendSystemMessage(
  tx: Prisma.TransactionClient,
  input: { conversationId: string; systemCode: string; body: string; clientMessageId: string },
) {
  const message = await tx.messageV2.upsert({
    where: { conversationId_clientMessageId: { conversationId: input.conversationId, clientMessageId: input.clientMessageId } },
    update: {},
    create: { ...input, senderId: null, kind: "SYSTEM" },
    select: { id: true, createdAt: true },
  });
  await advanceConversationLastMessage(tx, input.conversationId, message.createdAt);
  return message;
}
