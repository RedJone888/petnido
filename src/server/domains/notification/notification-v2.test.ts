import { describe, expect, it, vi } from "vitest";

import { createNotificationEvent } from "./notification-v2";

describe("NotificationV2 events", () => {
  it("uses an event key upsert so command retries cannot duplicate a notification", async () => {
    const tx = { notificationV2: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) }, user: { findFirst: vi.fn().mockResolvedValue(null) }, emailOutboxV2: { upsert: vi.fn() } };
    const input = {
      eventKey: "booking:booking-1:confirmed",
      recipientId: "customer",
      actorId: "provider",
      type: "BOOKING_CONFIRMED" as const,
      resourceKind: "BOOKING" as const,
      resourceId: "booking-1",
      subject: "Boarding",
    };
    await createNotificationEvent(tx as never, input);
    await createNotificationEvent(tx as never, input);
    expect(tx.notificationV2.upsert).toHaveBeenCalledTimes(2);
    expect(tx.notificationV2.upsert.mock.calls[0][0].where).toEqual(tx.notificationV2.upsert.mock.calls[1][0].where);
  });

  it("does not notify an actor about their own event", async () => {
    const tx = { notificationV2: { upsert: vi.fn() }, user: { findFirst: vi.fn() }, emailOutboxV2: { upsert: vi.fn() } };
    await expect(createNotificationEvent(tx as never, {
      eventKey: "need:1:matched", recipientId: "owner", actorId: "owner",
      type: "NEED_MATCHED", resourceKind: "APPLICATION", resourceId: "application-1", subject: "Need",
    })).resolves.toBeNull();
    expect(tx.notificationV2.upsert).not.toHaveBeenCalled();
  });

  it("enqueues one email only for an enabled recipient with a verified email", async () => {
    const tx = {
      notificationV2: { upsert: vi.fn().mockResolvedValue({ id: "notification-1" }) },
      user: { findFirst: vi.fn().mockResolvedValue({ profile: { preferredLocale: "zh" } }) },
      emailOutboxV2: { upsert: vi.fn().mockResolvedValue({ id: "outbox-1" }) },
    };
    await createNotificationEvent(tx as never, {
      eventKey: "message:1:recipient:owner", recipientId: "owner", actorId: "sender",
      type: "MESSAGE_RECEIVED", resourceKind: "CONVERSATION", resourceId: "conversation-1", subject: "Need",
    });
    expect(tx.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      emailVerified: { not: null },
      OR: [
        { notificationPreference: { is: null } },
        { notificationPreference: { is: { emailInstant: true } } },
      ],
    }) }));
    expect(tx.emailOutboxV2.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { notificationId: "notification-1" }, create: expect.objectContaining({ recipientId: "owner", locale: "zh" }) }));
  });
});
