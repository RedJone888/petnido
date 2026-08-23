import { describe, expect, it, vi } from "vitest";

import {
  acceptNeedApplication,
  ApplicationCommandError,
  cancelNeedApplication,
  createNeedApplication,
} from "./need-application-v2";

const application = {
  id: "application-1", idempotencyKey: "application:key-1", needSource: "V2" as const, needId: "need-1",
  needTitleSnapshot: "Rabbit care", needModeSnapshot: "HOME_VISIT", ownerId: "owner", applicantId: "applicant",
  conversationId: "conversation-1", state: "PENDING" as const, decidedAt: null, cancelledAt: null,
  createdAt: new Date("2026-08-04T00:00:00.000Z"), updatedAt: new Date("2026-08-04T00:00:00.000Z"),
};

function fixture() {
  const createdAt = new Date("2026-08-04T00:00:00.000Z");
  const tx = {
    needApplicationV2: {
      findUnique: vi.fn().mockResolvedValue(null), findFirst: vi.fn().mockResolvedValue(application),
      findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({ id: application.id, state: "PENDING" }),
      update: vi.fn().mockResolvedValue({}), updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    needV2: {
      findFirst: vi.fn().mockResolvedValue({
        ownerId: "owner",
        mode: "HOME_VISIT",
        pets: [{ name: "Mochi", petType: "CAT", customPetType: null }],
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    need: { findFirst: vi.fn(), updateMany: vi.fn() },
    serviceV2: { findFirst: vi.fn() }, service: { findFirst: vi.fn() },
    conversationV2: { upsert: vi.fn().mockResolvedValue({ id: "conversation-1" }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    conversationParticipantV2: { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
    messageV2: { upsert: vi.fn().mockResolvedValue({ id: "message-1", createdAt }) },
    notificationV2: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) },
    user: { findFirst: vi.fn().mockResolvedValue(null) },
    emailOutboxV2: { upsert: vi.fn().mockResolvedValue({ id: "outbox-1" }) },
  };
  const prisma = { $transaction: vi.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
  return { tx, prisma };
}

describe("NeedApplicationV2 commands", () => {
  it("returns an existing application before creating a duplicate message", async () => {
    const { tx, prisma } = fixture();
    tx.needApplicationV2.findUnique.mockResolvedValueOnce(application);
    const result = await createNeedApplication(prisma as never, {
      actorId: "applicant",
      target: { kind: "NEED", publicId: "v2:need-1", source: "V2", contextId: "need-1" },
      body: "I can help", idempotencyKey: application.idempotencyKey,
    });
    expect(result.alreadyExists).toBe(true);
    expect(tx.messageV2.upsert).not.toHaveBeenCalled();
    expect(tx.needApplicationV2.create).not.toHaveBeenCalled();
  });

  it("creates the pending application only after conversation and message setup in the same transaction", async () => {
    const { tx, prisma } = fixture();
    const result = await createNeedApplication(prisma as never, {
      actorId: "applicant",
      target: { kind: "NEED", publicId: "v2:need-1", source: "V2", contextId: "need-1" },
      body: "I have rabbit experience", idempotencyKey: "application:new-key",
    });
    expect(result).toMatchObject({ state: "PENDING", alreadyExists: false, conversationId: "conversation-1" });
    expect(tx.conversationV2.upsert).toHaveBeenCalledOnce();
    expect(tx.messageV2.upsert).toHaveBeenCalledOnce();
    expect(tx.needApplicationV2.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ownerId: "owner", applicantId: "applicant" }) }));
    expect(tx.notificationV2.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ type: "APPLICATION_RECEIVED", recipientId: "owner" }) }));
  });

  it("atomically claims an open need and ends all other pending applications", async () => {
    const { tx, prisma } = fixture();
    tx.needApplicationV2.findMany.mockResolvedValueOnce([{ id: "application-2", conversationId: "conversation-2" }]);
    const result = await acceptNeedApplication(prisma as never, { ownerId: "owner", applicationId: application.id, now: new Date("2026-08-04T00:00:00.000Z") });
    expect(result.state).toBe("ACCEPTED");
    expect(tx.needV2.updateMany.mock.calls[0][0]).toMatchObject({ where: { state: "OPEN" }, data: { state: "MATCHED" } });
    expect(tx.needApplicationV2.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: { in: ["application-2"] } }), data: expect.objectContaining({ state: "NEED_ENDED" }) }));
    expect(tx.messageV2.upsert).toHaveBeenCalledTimes(2);
    expect(tx.notificationV2.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ type: "APPLICATION_ACCEPTED", recipientId: "applicant" }) }));
  });

  it("loses the concurrent accept race when the need is no longer OPEN", async () => {
    const { tx, prisma } = fixture();
    tx.needV2.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(acceptNeedApplication(prisma as never, { ownerId: "owner", applicationId: application.id }))
      .rejects.toEqual(expect.objectContaining({ code: "CONFLICTING_UPDATE" }));
    expect(tx.needApplicationV2.updateMany).not.toHaveBeenCalled();
  });

  it("reopens an unexpired matched need when either side cancels the accepted selection", async () => {
    const { tx, prisma } = fixture();
    tx.needApplicationV2.findUnique.mockResolvedValueOnce({ ...application, state: "ACCEPTED" });
    const result = await cancelNeedApplication(prisma as never, { actorId: "owner", applicationId: application.id, now: new Date("2026-08-04T00:00:00.000Z") });
    expect(result).toMatchObject({ state: "CANCELLED", needReopened: true });
    expect(tx.needV2.updateMany.mock.calls[0][0]).toMatchObject({ where: { state: "MATCHED" }, data: { state: "OPEN" } });
  });

  it("rejects application management by an unrelated user", async () => {
    const { tx, prisma } = fixture();
    tx.needApplicationV2.findUnique.mockResolvedValueOnce(application);
    await expect(cancelNeedApplication(prisma as never, { actorId: "outsider", applicationId: application.id }))
      .rejects.toBeInstanceOf(ApplicationCommandError);
    expect(tx.needApplicationV2.update).not.toHaveBeenCalled();
  });
});
