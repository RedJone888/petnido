import { beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "../../.generated/validation-client";
import {
  issueSignupChallenge,
  verifySignupChallenge,
} from "../../src/server/domains/auth/email-verification";

const prisma = new PrismaClient();
const now = new Date("2026-08-04T00:00:00.000Z");

async function clearAuthData() {
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.emailVerificationChallenge.deleteMany();
  await prisma.authRateLimitBucket.deleteMany();
}

beforeEach(clearAuthData);

describe("email verification persistence", () => {
  it("stores a hash, enforces cooldown and never stores the raw code", async () => {
    let deliveredCode = "";
    const result = await issueSignupChallenge({
      db: prisma as any,
      email: "new@example.com",
      requestIp: "192.0.2.1",
      now,
      deliver: async (code) => {
        deliveredCode = code;
      },
    });

    expect(deliveredCode).toMatch(/^\d{6}$/);
    expect(result.cooldownSeconds).toBe(60);
    const stored = await prisma.emailVerificationChallenge.findUniqueOrThrow({
      where: {
        identifier_purpose: {
          identifier: "new@example.com",
          purpose: "SIGN_UP",
        },
      },
    });
    expect(stored.codeHash).not.toBe(deliveredCode);

    await expect(
      issueSignupChallenge({
        db: prisma as any,
        email: "new@example.com",
        requestIp: "192.0.2.1",
        now: new Date(now.getTime() + 10_000),
        deliver: async () => undefined,
      }),
    ).rejects.toThrowError("VERIFICATION_RATE_LIMITED");
  });

  it("consumes a valid code once and creates one user profile", async () => {
    let deliveredCode = "";
    await issueSignupChallenge({
      db: prisma as any,
      email: "once@example.com",
      requestIp: "192.0.2.2",
      now,
      deliver: async (code) => {
        deliveredCode = code;
      },
    });

    const input = {
      db: prisma as any,
      email: "once@example.com",
      username: "Once",
      password: "password1",
      code: deliveredCode,
      requestIp: "192.0.2.2",
      now: new Date(now.getTime() + 1_000),
    };
    await expect(verifySignupChallenge(input)).resolves.toMatchObject({
      email: "once@example.com",
    });
    await expect(verifySignupChallenge(input)).rejects.toThrow();

    expect(await prisma.user.count({ where: { email: "once@example.com" } })).toBe(
      1,
    );
    expect(await prisma.profile.count()).toBe(1);
  });

  it("allows only one concurrent consumer for the same code", async () => {
    let deliveredCode = "";
    await issueSignupChallenge({
      db: prisma as any,
      email: "race@example.com",
      requestIp: "192.0.2.3",
      now,
      deliver: async (code) => {
        deliveredCode = code;
      },
    });

    const base = {
      db: prisma as any,
      email: "race@example.com",
      username: "Race",
      password: "password1",
      code: deliveredCode,
      now: new Date(now.getTime() + 1_000),
    };
    const results = await Promise.allSettled([
      verifySignupChallenge({ ...base, requestIp: "192.0.2.31" }),
      verifySignupChallenge({ ...base, requestIp: "192.0.2.32" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(
      1,
    );
    expect(await prisma.user.count({ where: { email: "race@example.com" } })).toBe(
      1,
    );
  });
});
