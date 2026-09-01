import { describe, expect, it } from "vitest";

import {
  createNeedPublishingContinuationToken,
  isNeedPublishingContinuation,
  verifyNeedPublishingContinuationToken,
} from "./continuation";

const secret = "test-secret-that-is-long-enough-for-signing";
const now = new Date();

describe("need publishing auth continuation", () => {
  it("round-trips a signed POST_NEED context", () => {
    const token = createNeedPublishingContinuationToken({
      secret,
      now,
      nonce: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(
      verifyNeedPublishingContinuationToken(token, { secret, now }),
    ).toMatchObject({ purpose: "POST_NEED", version: 1 });
    expect(
      isNeedPublishingContinuation(
        `/needs/create?restore=auth&needPublishContext=${encodeURIComponent(token)}`,
        { secret, now },
      ),
    ).toBe(true);
  });

  it("rejects tampering, expiry and an unsigned return URL", () => {
    const token = createNeedPublishingContinuationToken({
      secret,
      now,
      ttlSeconds: 60,
    });
    expect(
      verifyNeedPublishingContinuationToken(`${token}x`, { secret, now }),
    ).toBeNull();
    expect(
      verifyNeedPublishingContinuationToken(token, {
        secret,
        now: new Date(now.getTime() + 61_000),
      }),
    ).toBeNull();
    expect(isNeedPublishingContinuation("/needs/create?restore=auth")).toBe(false);
    expect(
      isNeedPublishingContinuation(
        "/needs/create?restore=auth&needPublishContext=forged",
      ),
    ).toBe(false);
  });
});
