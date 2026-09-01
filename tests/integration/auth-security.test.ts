import { beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../../.generated/validation-client";
import {
  issueEmailChangeChallenge,
  issuePasswordSetupChallenge,
  issueSignupChallenge,
  confirmPasswordSetup,
  verifyPasswordSetupChallenge,
  verifyEmailChangeChallenge,
  verifySignupChallenge,
} from "../../src/modules/auth/server/verification";

const prisma = new PrismaClient();
const now = new Date("2026-08-04T00:00:00.000Z");

async function clearAuthData() {
  await prisma.serviceV2.deleteMany();
  await prisma.needV2.deleteMany();
  await prisma.locationSnapshotV2.deleteMany();
  await prisma.publishDraftV2.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.emailVerificationChallenge.deleteMany();
  await prisma.authRateLimitBucket.deleteMany();
}

beforeEach(clearAuthData);

describe("email verification persistence", () => {
  it("rejects a registered email before sending a signup code", async () => {
    await prisma.user.create({
      data: { email: "registered@example.com", profile: { create: {} } },
    });
    let delivered = false;
    await expect(
      issueSignupChallenge({
        db: prisma as any,
        email: "REGISTERED@example.com",
        requestIp: "192.0.2.10",
        now,
        deliver: async () => {
          delivered = true;
        },
      }),
    ).rejects.toThrowError("EMAIL_ALREADY_REGISTERED");
    expect(delivered).toBe(false);
  });

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

  it("changes a signed-in user's email only after verifying the new address", async () => {
    const user = await prisma.user.create({
      data: {
        email: "current@example.com",
        emailVerified: now,
        profile: { create: {} },
      },
    });
    let deliveredCode = "";
    await issueEmailChangeChallenge({
      db: prisma as any,
      userId: user.id,
      email: "replacement@example.com",
      requestIp: "192.0.2.41",
      now,
      deliver: async (code) => {
        deliveredCode = code;
      },
    });

    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ).toMatchObject({ email: "current@example.com" });
    await expect(
      verifyEmailChangeChallenge({
        db: prisma as any,
        userId: user.id,
        email: "replacement@example.com",
        code: deliveredCode,
        requestIp: "192.0.2.41",
        now: new Date(now.getTime() + 1_000),
      }),
    ).resolves.toMatchObject({
      email: "replacement@example.com",
      emailVerified: new Date(now.getTime() + 1_000),
    });
  });

  it("binds email-change codes to one account and rejects registered emails", async () => {
    const first = await prisma.user.create({
      data: { email: "first@example.com", profile: { create: {} } },
    });
    const second = await prisma.user.create({
      data: { email: "second@example.com", profile: { create: {} } },
    });
    await expect(
      issueEmailChangeChallenge({
        db: prisma as any,
        userId: first.id,
        email: "second@example.com",
        requestIp: "192.0.2.42",
        now,
        deliver: async () => undefined,
      }),
    ).rejects.toThrowError("EMAIL_ALREADY_REGISTERED");

    let deliveredCode = "";
    await issueEmailChangeChallenge({
      db: prisma as any,
      userId: first.id,
      email: "unused@example.com",
      requestIp: "192.0.2.43",
      now,
      deliver: async (code) => {
        deliveredCode = code;
      },
    });
    await expect(
      verifyEmailChangeChallenge({
        db: prisma as any,
        userId: second.id,
        email: "unused@example.com",
        code: deliveredCode,
        requestIp: "192.0.2.44",
        now: new Date(now.getTime() + 1_000),
      }),
    ).rejects.toThrowError("INVALID_CODE");
  });

  it("binds password setup to the signed-in account", async () => {
    const first = await prisma.user.create({
      data: {
        email: "password-owner@example.com",
        profile: { create: {} },
      },
    });
    const second = await prisma.user.create({
      data: {
        email: "other-owner@example.com",
        emailVerified: now,
        profile: { create: {} },
      },
    });
    let deliveredCode = "";
    await issuePasswordSetupChallenge({
      db: prisma as any,
      userId: first.id,
      requestIp: "192.0.2.51",
      now,
      deliver: async (code) => {
        deliveredCode = code;
      },
    });

    await expect(
      verifyPasswordSetupChallenge({
        db: prisma as any,
        userId: second.id,
        code: deliveredCode,
        requestIp: "192.0.2.52",
        now: new Date(now.getTime() + 1_000),
      }),
    ).rejects.toThrow();

    await expect(
      verifyPasswordSetupChallenge({
        db: prisma as any,
        userId: first.id,
        code: deliveredCode,
        requestIp: "192.0.2.51",
        now: new Date(now.getTime() + 1_000),
      }),
    ).resolves.toEqual({ verified: true });

    await expect(
      confirmPasswordSetup({
        db: prisma as any,
        userId: first.id,
        code: deliveredCode,
        password: "password2",
        requestIp: "192.0.2.51",
        now: new Date(now.getTime() + 1_000),
      }),
    ).resolves.toEqual({ completed: true });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: first.id } });
    expect(updated.passwordHash).toBeTruthy();
    expect(updated.emailVerified).toEqual(new Date(now.getTime() + 1_000));
    await expect(bcrypt.compare("password2", updated.passwordHash!)).resolves.toBe(true);
  });
});
