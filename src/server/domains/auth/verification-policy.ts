export const VERIFICATION_PURPOSE = "SIGN_UP";
export const VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const VERIFICATION_COOLDOWN_MS = 60 * 1000;
export const VERIFICATION_SEND_WINDOW_MS = 60 * 60 * 1000;
export const VERIFICATION_MAX_SENDS = 5;
export const VERIFICATION_MAX_ATTEMPTS = 5;

export type ChallengePolicySnapshot = {
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  windowStartedAt: Date;
  sendCount: number;
  lastSentAt: Date;
  consumedAt: Date | null;
};

export type ChallengeIssuePlan = "CREATE" | "RESET_WINDOW" | "REFRESH";

export class VerificationPolicyError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "VerificationPolicyError";
  }
}

export function planChallengeIssue(
  existing: ChallengePolicySnapshot | null,
  now: Date,
): ChallengeIssuePlan {
  if (!existing) return "CREATE";

  const windowExpired =
    existing.windowStartedAt.getTime() + VERIFICATION_SEND_WINDOW_MS <=
    now.getTime();
  if (windowExpired || existing.consumedAt) return "RESET_WINDOW";

  if (
    existing.lastSentAt.getTime() + VERIFICATION_COOLDOWN_MS > now.getTime() ||
    existing.sendCount >= VERIFICATION_MAX_SENDS
  ) {
    throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
  }

  return "REFRESH";
}

export function assertChallengeUsable(
  challenge: ChallengePolicySnapshot | null,
  now: Date,
): asserts challenge is ChallengePolicySnapshot {
  if (!challenge || challenge.consumedAt) {
    throw new VerificationPolicyError("INVALID_CODE");
  }
  if (challenge.expiresAt.getTime() <= now.getTime()) {
    throw new VerificationPolicyError("CODE_EXPIRED");
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    throw new VerificationPolicyError("TOO_MANY_CODE_ATTEMPTS");
  }
}
