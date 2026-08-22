import { describe, expect, it } from "vitest";

import {
  assertChallengeUsable,
  planChallengeIssue,
  VERIFICATION_MAX_ATTEMPTS,
} from "@/modules/auth/server/verification-policy";
import { AuthPolicyError } from "@/modules/auth/server/errors";

const now = new Date("2026-08-04T00:00:00.000Z");

function challenge(overrides: Record<string, unknown> = {}) {
  return {
    expiresAt: new Date("2026-08-04T00:10:00.000Z"),
    attempts: 0,
    maxAttempts: VERIFICATION_MAX_ATTEMPTS,
    windowStartedAt: new Date("2026-08-04T00:00:00.000Z"),
    sendCount: 1,
    lastSentAt: new Date("2026-08-03T23:58:00.000Z"),
    consumedAt: null,
    ...overrides,
  };
}

describe("verification challenge policy", () => {
  it("creates the first challenge and refreshes an eligible challenge", () => {
    expect(planChallengeIssue(null, now)).toBe("CREATE");
    expect(planChallengeIssue(challenge(), now)).toBe("REFRESH");
  });

  it("blocks resend during cooldown or after the hourly maximum", () => {
    const duringCooldown = challenge({ lastSentAt: now });
    expect(() => planChallengeIssue(duringCooldown, now)).toThrowError(
      new AuthPolicyError("VERIFICATION_RATE_LIMITED"),
    );
    expect(() =>
      planChallengeIssue(challenge({ sendCount: 5 }), now),
    ).toThrowError("VERIFICATION_RATE_LIMITED");
  });

  it("resets a consumed or expired send window", () => {
    expect(
      planChallengeIssue(challenge({ consumedAt: new Date() }), now),
    ).toBe("RESET_WINDOW");
    expect(
      planChallengeIssue(
        challenge({ windowStartedAt: new Date("2026-08-03T22:00:00Z") }),
        now,
      ),
    ).toBe("RESET_WINDOW");
  });

  it("rejects missing, expired, consumed and exhausted challenges", () => {
    expect(() => assertChallengeUsable(null, now)).toThrowError("INVALID_CODE");
    expect(() =>
      assertChallengeUsable(challenge({ expiresAt: now }), now),
    ).toThrowError("CODE_EXPIRED");
    expect(() =>
      assertChallengeUsable(challenge({ consumedAt: now }), now),
    ).toThrowError("INVALID_CODE");
    expect(() =>
      assertChallengeUsable(challenge({ attempts: 5 }), now),
    ).toThrowError("TOO_MANY_CODE_ATTEMPTS");
  });
});
