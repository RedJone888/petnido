import { describe, expect, it } from "vitest";

import {
  clientMessageIdSchema,
  conversationContextTargetSchema,
  conversationPairKey,
  decodeMessageCursor,
  encodeMessageCursor,
  hasUnreadMessages,
  messageBodySchema,
} from "./conversation";

describe("conversation domain", () => {
  it("builds the same collision-resistant participant pair key in either order", () => {
    expect(conversationPairKey("user-a", "longer-user-b")).toBe(conversationPairKey("longer-user-b", "user-a"));
    expect(() => conversationPairKey("same", "same")).toThrow("INVALID_CONVERSATION_PARTICIPANTS");
  });

  it("accepts source-qualified targets and bounded idempotent user messages", () => {
    expect(conversationContextTargetSchema.parse({ kind: "NEED", publicId: "v2:need-1" })).toMatchObject({ source: "V2", contextId: "need-1" });
    expect(conversationContextTargetSchema.safeParse({ kind: "SERVICE", publicId: "service-1" }).success).toBe(false);
    expect(messageBodySchema.parse("  hello  ")).toBe("hello");
    expect(messageBodySchema.safeParse(" ").success).toBe(false);
    expect(clientMessageIdSchema.safeParse("message:1234").success).toBe(true);
  });

  it("round-trips stable message cursors and rejects malformed cursors", () => {
    const cursor = { createdAt: "2026-08-04T00:00:00.000Z", id: "message-1" };
    expect(decodeMessageCursor(encodeMessageCursor(cursor))).toEqual(cursor);
    expect(decodeMessageCursor("not-a-cursor")).toBeNull();
  });

  it("derives unread state only from a message newer than the participant read marker", () => {
    const message = new Date("2026-08-04T01:00:00.000Z");
    expect(hasUnreadMessages(message, null)).toBe(true);
    expect(hasUnreadMessages(message, new Date("2026-08-04T01:00:00.000Z"))).toBe(false);
    expect(hasUnreadMessages(message, new Date("2026-08-04T00:59:59.000Z"))).toBe(true);
  });
});
