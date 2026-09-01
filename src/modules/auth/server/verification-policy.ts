import { AuthPolicyError } from "./errors";

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

export function planChallengeIssue(existing: ChallengePolicySnapshot | null, now: Date) {
  if (!existing) return "CREATE" as const;
  const expired = existing.windowStartedAt.getTime() + VERIFICATION_SEND_WINDOW_MS <= now.getTime();
  if (expired || existing.consumedAt) return "RESET_WINDOW" as const;
  if (
    existing.lastSentAt.getTime() + VERIFICATION_COOLDOWN_MS > now.getTime() ||
    existing.sendCount >= VERIFICATION_MAX_SENDS
  ) {
    throw new AuthPolicyError("VERIFICATION_RATE_LIMITED");
  }
  return "REFRESH" as const;
}

export function assertChallengeUsable(
  challenge: ChallengePolicySnapshot | null,
  now: Date,
): asserts challenge is ChallengePolicySnapshot {
  if (!challenge || challenge.consumedAt) throw new AuthPolicyError("INVALID_CODE");
  if (challenge.expiresAt.getTime() <= now.getTime()) throw new AuthPolicyError("CODE_EXPIRED");
  if (challenge.attempts >= challenge.maxAttempts) {
    throw new AuthPolicyError("TOO_MANY_CODE_ATTEMPTS");
  }
}
