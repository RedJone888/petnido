import { describe, expect, it, vi } from "vitest";

import {
  ConversationCommandError,
  resolveConsultationTarget,
  sendConversationMessage,
  startConsultation,
} from "./conversation-v2";

function commandFixture() {
  const createdAt = new Date("2026-08-04T00:00:00.000Z");
  const tx = {
    needV2: { findFirst: vi.fn().mockResolvedValue({ ownerId: "owner", title: "Rabbit visit", mode: "HOME_VISIT" }) },
    need: { findFirst: vi.fn() }, serviceV2: { findFirst: vi.fn() }, service: { findFirst: vi.fn() },
    conversationV2: {
      upsert: vi.fn().mockResolvedValue({ id: "conversation-1" }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockResolvedValue({ contextTitle: "Rabbit visit", participants: [{ userId: "actor" }, { userId: "owner" }] }),
    },
    conversationParticipantV2: {
      upsert: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue({ userId: "actor" }),
    },
    messageV2: {
      upsert: vi.fn().mockResolvedValue({ id: "message-1", createdAt }),
    },
    notificationV2: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) },
    user: { findFirst: vi.fn().mockResolvedValue(null) },
    emailOutboxV2: { upsert: vi.fn().mockResolvedValue({ id: "outbox-1" }) },
  };
  const prisma = {
    $transaction: vi.fn((callback: (value: typeof tx) => unknown) => callback(tx)),
  };
  return { prisma, tx };
}

describe("conversation V2 commands", () => {
  it("reuses the target-and-pair conversation and the same client message key", async () => {
    const { prisma, tx } = commandFixture();
    const input = {
      actorId: "actor",
      target: { kind: "NEED" as const, publicId: "v2:need-1", source: "V2" as const, contextId: "need-1" },
      body: "Is the afternoon suitable?",
      clientMessageId: "pending:123e4567-e89b-12d3-a456-426614174000",
    };
    await startConsultation(prisma as never, input);
    await startConsultation(prisma as never, input);

    const conversationWhere = tx.conversationV2.upsert.mock.calls[0][0].where;
    expect(conversationWhere.contextKind_contextSource_contextId_participantPairKey).toMatchObject({ contextKind: "NEED", contextSource: "V2", contextId: "need-1" });
    expect(tx.conversationV2.upsert.mock.calls[1][0].where).toEqual(conversationWhere);
    expect(tx.messageV2.upsert.mock.calls[0][0].where).toEqual(tx.messageV2.upsert.mock.calls[1][0].where);
    expect(tx.conversationParticipantV2.upsert).toHaveBeenCalledTimes(4);
    expect(tx.conversationParticipantV2.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { conversationId_userId: { conversationId: "conversation-1", userId: "actor" } },
    }));
    expect(tx.notificationV2.upsert.mock.calls[0][0].where).toEqual(tx.notificationV2.upsert.mock.calls[1][0].where);
  });

  it("rejects self-consultation even when the target is otherwise public", async () => {
    const prisma = {
      needV2: { findFirst: vi.fn().mockResolvedValue({ ownerId: "actor", title: "Own need", mode: "CUSTOM" }) },
    };
    await expect(resolveConsultationTarget(prisma as never, { kind: "NEED", publicId: "v2:need-1", source: "V2", contextId: "need-1" }, "actor"))
      .rejects.toEqual(expect.objectContaining({ code: "FORBIDDEN_RESOURCE_ACTION" }));
  });

  it("checks participant membership before accepting a message", async () => {
    const { prisma, tx } = commandFixture();
    tx.conversationParticipantV2.findUnique.mockResolvedValueOnce(null);
    await expect(sendConversationMessage(prisma as never, {
      actorId: "outsider",
      conversationId: "conversation-1",
      body: "unauthorized",
      clientMessageId: "message:outsider-1",
    })).rejects.toBeInstanceOf(ConversationCommandError);
    expect(tx.messageV2.upsert).not.toHaveBeenCalled();
  });

  it("uses message upsert and advances read state for an authorized retry", async () => {
    const { prisma, tx } = commandFixture();
    const input = { actorId: "actor", conversationId: "conversation-1", body: "hello", clientMessageId: "message:retry-1" };
    await sendConversationMessage(prisma as never, input);
    await sendConversationMessage(prisma as never, input);
    expect(tx.messageV2.upsert.mock.calls[0][0].where).toEqual(tx.messageV2.upsert.mock.calls[1][0].where);
    expect(tx.conversationParticipantV2.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ archivedAt: null }) }));
    expect(tx.notificationV2.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ recipientId: "owner", type: "MESSAGE_RECEIVED" }) }));
  });
});
