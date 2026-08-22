import { describe, expect, it, vi } from "vitest";

import { processEmailOutboxBatch } from "./email-outbox-v2";

function fixture(eligible = true) {
  const now = new Date("2026-08-04T00:00:00.000Z");
  const emailOutboxV2 = {
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    findMany: vi.fn().mockResolvedValue([{ id: "outbox-1", state: "PENDING", attempts: 0 }]),
    findUnique: vi.fn().mockResolvedValue({
      id: "outbox-1", locale: "zh", notification: { type: "MESSAGE_RECEIVED" },
      recipient: { email: "owner@example.com", emailVerified: eligible ? now : null, profile: { preferredLocale: "zh" }, notificationPreference: { emailInstant: eligible } },
    }),
  };
  return { now, prisma: { emailOutboxV2 }, emailOutboxV2 };
}

describe("email outbox worker", () => {
  it("pauses delivery while the cutover flag is explicitly disabled", async () => {
    process.env.FEATURE_EMAIL_OUTBOX = "false";
    try {
      const { now, prisma } = fixture();
      await expect(processEmailOutboxBatch(prisma as never, { send: vi.fn(), baseUrl: "https://petnido.example", now })).resolves.toEqual({ inspected: 0, sent: 0, failed: 0, cancelled: 0 });
    } finally {
      delete process.env.FEATURE_EMAIL_OUTBOX;
    }
  });

  it("claims and sends an eligible job without exposing notification content", async () => {
    const { now, prisma, emailOutboxV2 } = fixture();
    const send = vi.fn().mockResolvedValue(undefined);
    const result = await processEmailOutboxBatch(prisma as never, { send, baseUrl: "https://petnido.example", now });
    expect(result).toEqual({ inspected: 1, sent: 1, failed: 0, cancelled: 0 });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@example.com" }));
    expect(JSON.stringify(send.mock.calls[0][0])).not.toContain("private message");
    expect(emailOutboxV2.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ state: "SENT", lastErrorCode: null }) }));
  });

  it("treats a missing preference row as default-on", async () => {
    const { now, prisma, emailOutboxV2 } = fixture();
    const job = await emailOutboxV2.findUnique();
    job.recipient.notificationPreference = null;
    emailOutboxV2.findUnique.mockResolvedValue(job);
    const send = vi.fn().mockResolvedValue(undefined);
    await expect(processEmailOutboxBatch(prisma as never, { send, baseUrl: "https://petnido.example", now })).resolves.toMatchObject({ sent: 1 });
    expect(send).toHaveBeenCalledOnce();
  });

  it("cancels queued delivery after unsubscribe or loss of email verification", async () => {
    const { now, prisma, emailOutboxV2 } = fixture(false);
    const send = vi.fn();
    const result = await processEmailOutboxBatch(prisma as never, { send, baseUrl: "https://petnido.example", now });
    expect(result.cancelled).toBe(1);
    expect(send).not.toHaveBeenCalled();
    expect(emailOutboxV2.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ state: "CANCELLED", lastErrorCode: "RECIPIENT_INELIGIBLE" }) }));
  });

  it("records only a generic error code and schedules a retry after a send failure", async () => {
    const { now, prisma, emailOutboxV2 } = fixture();
    const result = await processEmailOutboxBatch(prisma as never, { send: vi.fn().mockRejectedValue(new Error("SMTP leaked detail")), baseUrl: "https://petnido.example", now });
    expect(result.failed).toBe(1);
    expect(emailOutboxV2.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ state: "FAILED", lastErrorCode: "SEND_FAILED", attempts: { increment: 1 } }) }));
    expect(JSON.stringify(emailOutboxV2.updateMany.mock.calls)).not.toContain("SMTP leaked detail");
  });
});
