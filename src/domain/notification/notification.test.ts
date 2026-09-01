import { describe, expect, it } from "vitest";

import { notificationPresentation, notificationResourceAuthorized, notificationResourceHref } from "./notification";

describe("notification presentation and safe links", () => {
  it("renders message notices without including the message body", () => {
    const text = notificationPresentation({ type: "MESSAGE_RECEIVED", subject: "Rabbit visit" }, "zh");
    expect(text).toEqual({ title: "收到新消息", body: "关于“Rabbit visit”的会话有一条新消息。" });
    expect(JSON.stringify(text)).not.toContain("private message");
  });

  it("only creates fixed dashboard destinations and escapes identifiers", () => {
    expect(notificationResourceHref("CONVERSATION", "conversation&admin=1")).toBe("/dashboard/messages?conversation=conversation%26admin%3D1");
    expect(notificationResourceHref("APPLICATION", "application-1")).toBe("/dashboard/applications?application=application-1");
    expect(notificationResourceHref("BOOKING", "booking-1")).toBe("/dashboard/bookings?booking=booking-1");
  });

  it("rejects a link target not present in the recipient's authorized resources", () => {
    const memberships = {
      CONVERSATION: new Set(["conversation-1"]),
      APPLICATION: new Set(["application-1"]),
      BOOKING: new Set(["booking-1"]),
    };
    expect(notificationResourceAuthorized({ resourceKind: "CONVERSATION", resourceId: "conversation-1" }, memberships)).toBe(true);
    expect(notificationResourceAuthorized({ resourceKind: "CONVERSATION", resourceId: "conversation-outsider" }, memberships)).toBe(false);
  });

  it("has usable copy in all three supported languages", () => {
    for (const locale of ["zh", "en", "ja"] as const) {
      expect(notificationPresentation({ type: "BOOKING_CONFIRMED", subject: "Boarding" }, locale).title).toBeTruthy();
    }
  });
});
