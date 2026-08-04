import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { consumeFixedWindowLimit } from "./rate-limit";
import {
  assertChallengeUsable,
  planChallengeIssue,
  VERIFICATION_COOLDOWN_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_PURPOSE,
  VERIFICATION_TTL_MS,
  VerificationPolicyError,
} from "./verification-policy";

type AuthDb = Pick<
  PrismaClient,
  "emailVerificationChallenge" | "authRateLimitBucket" | "user" | "$transaction"
>;

async function consumeEndpointLimits(
  db: AuthDb,
  action: string,
  email: string,
  requestIp: string,
  now: Date,
) {
  await consumeFixedWindowLimit(db, {
    action,
    kind: "ip",
    subject: requestIp,
    limit: action === "verification-send" ? 20 : 50,
    windowMs: 60 * 60 * 1000,
    now,
  });
  await consumeFixedWindowLimit(db, {
    action,
    kind: "email",
    subject: email,
    limit: action === "verification-send" ? 5 : 20,
    windowMs: 60 * 60 * 1000,
    now,
  });
}

export async function issueSignupChallenge(input: {
  db: AuthDb;
  email: string;
  requestIp: string;
  now?: Date;
  deliver: (code: string) => Promise<void>;
}) {
  const now = input.now ?? new Date();
  await consumeEndpointLimits(
    input.db,
    "verification-send",
    input.email,
    input.requestIp,
    now,
  );

  const existing = await input.db.emailVerificationChallenge.findUnique({
    where: {
      identifier_purpose: {
        identifier: input.email,
        purpose: VERIFICATION_PURPOSE,
      },
    },
  });
  const plan = planChallengeIssue(existing, now);
  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(now.getTime() + VERIFICATION_TTL_MS);

  if (plan === "CREATE") {
    try {
      await input.db.emailVerificationChallenge.create({
        data: {
          identifier: input.email,
          purpose: VERIFICATION_PURPOSE,
          codeHash,
          expiresAt,
          attempts: 0,
          maxAttempts: VERIFICATION_MAX_ATTEMPTS,
          windowStartedAt: now,
          sendCount: 1,
          lastSentAt: now,
        },
      });
    } catch {
      throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
    }
  } else {
    const updated = await input.db.emailVerificationChallenge.updateMany({
      where: { id: existing!.id, updatedAt: existing!.updatedAt },
      data: {
        codeHash,
        expiresAt,
        attempts: 0,
        maxAttempts: VERIFICATION_MAX_ATTEMPTS,
        consumedAt: null,
        lastSentAt: now,
        ...(plan === "RESET_WINDOW"
          ? { windowStartedAt: now, sendCount: 1 }
          : { sendCount: { increment: 1 } }),
      },
    });
    if (updated.count !== 1) {
      throw new VerificationPolicyError("VERIFICATION_RATE_LIMITED");
    }
  }

  await input.deliver(code);
  return {
    expiresAt,
    cooldownSeconds: Math.floor(VERIFICATION_COOLDOWN_MS / 1000),
  };
}

export async function verifySignupChallenge(input: {
  db: AuthDb;
  email: string;
  username: string;
  password: string;
  code: string;
  requestIp: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  await consumeEndpointLimits(
    input.db,
    "verification-check",
    input.email,
    input.requestIp,
    now,
  );

  const challenge = await input.db.emailVerificationChallenge.findUnique({
    where: {
      identifier_purpose: {
        identifier: input.email,
        purpose: VERIFICATION_PURPOSE,
      },
    },
  });
  assertChallengeUsable(challenge, now);

  const matches = await bcrypt.compare(input.code, challenge.codeHash);
  if (!matches) {
    await input.db.emailVerificationChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        attempts: challenge.attempts,
      },
      data: { attempts: { increment: 1 } },
    });
    throw new VerificationPolicyError("INVALID_CODE");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await input.db.$transaction(async (tx) => {
      const consumed = await tx.emailVerificationChallenge.updateMany({
        where: {
          id: challenge.id,
          consumedAt: null,
          attempts: challenge.attempts,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new VerificationPolicyError("INVALID_CODE");
      }

      const user = await tx.user.create({
        data: {
          email: input.email,
          password: passwordHash,
          name: input.username,
          profile: { create: { isOwner: true, isSitter: false } },
        },
        select: { id: true, email: true },
      });
      return user;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new VerificationPolicyError("EMAIL_ALREADY_REGISTERED");
    }
    throw error;
  }
}
