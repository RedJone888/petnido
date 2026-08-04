import { createHmac } from "crypto";
import type { PrismaClient } from "@prisma/client";

import { VerificationPolicyError } from "./verification-policy";

type RateLimitDb = Pick<PrismaClient, "authRateLimitBucket">;

function rateLimitSecret(): string {
  const value =
    process.env.AUTH_RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_RATE_LIMIT_SECRET_REQUIRED");
  }
  return "petnido-development-rate-limit-secret";
}

export function hashRateLimitSubject(
  action: string,
  kind: string,
  subject: string,
): string {
  return createHmac("sha256", rateLimitSecret())
    .update(`${action}:${kind}:${subject}`)
    .digest("hex");
}

export async function consumeFixedWindowLimit(
  db: RateLimitDb,
  input: {
    action: string;
    kind: string;
    subject: string;
    limit: number;
    windowMs: number;
    now: Date;
  },
) {
  const keyHash = hashRateLimitSubject(
    input.action,
    input.kind,
    input.subject,
  );
  const existing = await db.authRateLimitBucket.findUnique({
    where: { keyHash },
  });
  const expiresAt = new Date(input.now.getTime() + input.windowMs);

  if (!existing) {
    try {
      await db.authRateLimitBucket.create({
        data: {
          keyHash,
          action: input.action,
          count: 1,
          windowStartedAt: input.now,
          expiresAt,
        },
      });
      return;
    } catch {
      // A concurrent request created the same bucket. Failing closed is safer.
      throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
    }
  }

  if (existing.expiresAt.getTime() <= input.now.getTime()) {
    const reset = await db.authRateLimitBucket.updateMany({
      where: { keyHash, expiresAt: { lte: input.now } },
      data: {
        action: input.action,
        count: 1,
        windowStartedAt: input.now,
        expiresAt,
      },
    });
    if (reset.count === 1) return;
    throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
  }

  if (existing.count >= input.limit) {
    throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
  }

  const incremented = await db.authRateLimitBucket.updateMany({
    where: {
      keyHash,
      count: existing.count,
      expiresAt: { gt: input.now },
    },
    data: { count: { increment: 1 } },
  });
  if (incremented.count !== 1) {
    throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
  }
}
