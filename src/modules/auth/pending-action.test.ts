import { describe, expect, it } from "vitest";

import {
  createPendingActionToken,
  pendingActionStartSchema,
  verifyPendingActionToken,
} from "@/modules/auth/pending-action";

const secret = "test-secret-that-is-long-enough-for-hmac-signing";
const now = new Date("2026-08-04T00:00:00.000Z");

describe("pending action token", () => {
  it("round-trips a signed internal action", () => {
    const token = createPendingActionToken(
      {
        action: "APPLY_NEED",
        targetId: "need_123",
        returnTo: "/public/needs/need_123?from=nearby",
      },
      { secret, now, nonce: "123e4567-e89b-12d3-a456-426614174000" },
    );
    expect(verifyPendingActionToken(token, { secret, now })).toMatchObject({
      action: "APPLY_NEED",
      targetId: "need_123",
      returnTo: "/public/needs/need_123?from=nearby",
    });
  });

  it("rejects tampering and expiry", () => {
    const token = createPendingActionToken(
      {
        action: "BOOK_SERVICE",
        targetId: "service_123",
        returnTo: "/public/sitters/service_123",
        ttlSeconds: 60,
      },
      { secret, now },
    );
    expect(verifyPendingActionToken(`${token}x`, { secret, now })).toBeNull();
    expect(
      verifyPendingActionToken(token, {
        secret,
        now: new Date("2026-08-04T00:01:01.000Z"),
      }),
    ).toBeNull();
  });

  it("replaces an external return target before signing", () => {
    const token = createPendingActionToken(
      {
        action: "FAVORITE_NEED",
        targetId: "need_123",
        returnTo: "https://attacker.example/steal",
      },
      { secret, now },
    );
    expect(verifyPendingActionToken(token, { secret, now })?.returnTo).toBe("/");
  });

  it("accepts only source-qualified targets at the public start route", () => {
    expect(pendingActionStartSchema.parse({
      action: "FAVORITE_SERVICE",
      targetId: "legacy:service_123",
      returnTo: "/services/legacy%3Aservice_123",
    })).toMatchObject({ targetId: "legacy:service_123" });
    expect(pendingActionStartSchema.safeParse({
      action: "FAVORITE_NEED",
      targetId: "need_123",
    }).success).toBe(false);
  });
});
