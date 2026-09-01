import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma, type PrismaClient } from "@prisma/client";

import { normalizeEmail } from "../shared/email";
import { assertLineProvisionalUserIsEmpty } from "./account-service";
import { AuthPolicyError } from "./errors";
import { createLoginTicket } from "./login-ticket";
import { decryptOAuthAccount, getPendingGoogleLink } from "./oauth-link";
import { consumeFixedWindowLimit } from "./rate-limit";
import {
  assertChallengeUsable,
  planChallengeIssue,
  VERIFICATION_COOLDOWN_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_TTL_MS,
} from "./verification-policy";

type Deliver = (code: string) => Promise<void>;
type Challenge = Awaited<ReturnType<PrismaClient["emailVerificationChallenge"]["findUnique"]>>;

const purpose = {
  signup: "SIGN_UP",
  emailChange: (userId: string) => `EMAIL_CHANGE:${userId}`,
  passwordReset: "PASSWORD_RESET",
  passwordSetup: (userId: string) => `PASSWORD_SETUP:${userId}`,
  googleLink: (pendingId: string) => `GOOGLE_LINK:${pendingId}`,
  lineLink: (sourceId: string, targetId: string) => `LINE_LINK:${sourceId}:${targetId}`,
};

async function findEmailOwner(db: PrismaClient, email: string) {
  const user = await db.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, email: true, emailVerified: true, passwordHash: true, deletedAt: true },
  });
  return user?.deletedAt ? null : user;
}

async function consumeEndpointLimits(
  db: PrismaClient,
  action: string,
  email: string,
  requestIp: string,
  now: Date,
) {
  await consumeFixedWindowLimit(db, {
    action,
    kind: "ip",
    subject: requestIp,
    limit: action.endsWith("-send") ? 20 : 50,
    windowMs: 60 * 60 * 1000,
    now,
  });
  await consumeFixedWindowLimit(db, {
    action,
    kind: "email",
    subject: normalizeEmail(email),
    limit: action.endsWith("-send") ? 5 : 20,
    windowMs: 60 * 60 * 1000,
    now,
  });
}

async function issueChallenge(input: {
  db: PrismaClient;
  email: string;
  purpose: string;
  action: string;
  requestIp: string;
  deliver: Deliver;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const email = normalizeEmail(input.email);
  await consumeEndpointLimits(input.db, input.action, email, input.requestIp, now);
  const existing = await input.db.emailVerificationChallenge.findUnique({
    where: { identifier_purpose: { identifier: email, purpose: input.purpose } },
  });
  const plan = planChallengeIssue(existing, now);
  const code = randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(now.getTime() + VERIFICATION_TTL_MS);
  if (plan === "CREATE") {
    try {
      await input.db.emailVerificationChallenge.create({
        data: {
          identifier: email,
          purpose: input.purpose,
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
      throw new AuthPolicyError("VERIFICATION_RATE_LIMITED");
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
    if (updated.count !== 1) throw new AuthPolicyError("VERIFICATION_RATE_LIMITED");
  }
  await input.deliver(code);
  return { expiresAt, cooldownSeconds: Math.floor(VERIFICATION_COOLDOWN_MS / 1000) };
}

async function verifyChallenge(input: {
  db: PrismaClient;
  email: string;
  purpose: string;
  action: string;
  code: string;
  requestIp: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const email = normalizeEmail(input.email);
  await consumeEndpointLimits(input.db, input.action, email, input.requestIp, now);
  const challenge = await input.db.emailVerificationChallenge.findUnique({
    where: { identifier_purpose: { identifier: email, purpose: input.purpose } },
  });
  assertChallengeUsable(challenge, now);
  if (!(await bcrypt.compare(input.code, challenge.codeHash))) {
    await input.db.emailVerificationChallenge.updateMany({
      where: { id: challenge.id, consumedAt: null, attempts: challenge.attempts },
      data: { attempts: { increment: 1 } },
    });
    throw new AuthPolicyError("INVALID_CODE");
  }
  return { challenge, now, email };
}

async function consumeChallenge(
  tx: Prisma.TransactionClient,
  challenge: NonNullable<Challenge>,
  now: Date,
) {
  const consumed = await tx.emailVerificationChallenge.updateMany({
    where: {
      id: challenge.id,
      consumedAt: null,
      attempts: challenge.attempts,
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });
  if (consumed.count !== 1) throw new AuthPolicyError("INVALID_CODE");
}

function mapUniqueEmail(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AuthPolicyError("EMAIL_ALREADY_REGISTERED");
  }
  throw error;
}

export async function checkEmailExists(db: PrismaClient, email: string) {
  return Boolean(await findEmailOwner(db, email));
}

export async function issueSignupChallenge(input: {
  db: PrismaClient;
  email: string;
  requestIp: string;
  deliver: Deliver;
  now?: Date;
}) {
  if (await findEmailOwner(input.db, input.email)) {
    throw new AuthPolicyError("EMAIL_ALREADY_REGISTERED");
  }
  return issueChallenge({ ...input, purpose: purpose.signup, action: "signup-send" });
}

export async function verifySignupChallenge(input: {
  db: PrismaClient;
  email: string;
  username: string;
  password: string;
  code: string;
  requestIp: string;
  now?: Date;
}) {
  const verified = await verifyChallenge({
    ...input,
    purpose: purpose.signup,
    action: "signup-check",
  });
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    return await input.db.$transaction(async (tx) => {
      await consumeChallenge(tx, verified.challenge, verified.now);
      return tx.user.create({
        data: {
          email: verified.email,
          emailVerified: verified.now,
          passwordHash,
          name: input.username.trim(),
          profile: { create: { isOwner: true, isSitter: false } },
        },
        select: { id: true, email: true },
      });
    });
  } catch (error) {
    return mapUniqueEmail(error);
  }
}

export async function issueEmailChangeChallenge(input: {
  db: PrismaClient;
  userId: string;
  email: string;
  requestIp: string;
  deliver: Deliver;
  now?: Date;
}) {
  const current = await input.db.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { email: true },
  });
  if (!current) throw new AuthPolicyError("USER_NOT_FOUND");
  const email = normalizeEmail(input.email);
  if (current.email && normalizeEmail(current.email) === email) throw new AuthPolicyError("EMAIL_UNCHANGED");
  const owner = await findEmailOwner(input.db, email);
  if (owner && owner.id !== input.userId) throw new AuthPolicyError("EMAIL_ALREADY_REGISTERED");
  return issueChallenge({
    ...input,
    email,
    purpose: purpose.emailChange(input.userId),
    action: "email-change-send",
  });
}

export async function verifyEmailChangeChallenge(input: {
  db: PrismaClient;
  userId: string;
  email: string;
  code: string;
  requestIp: string;
  now?: Date;
}) {
  const verified = await verifyChallenge({
    ...input,
    purpose: purpose.emailChange(input.userId),
    action: "email-change-check",
  });
  const owner = await findEmailOwner(input.db, verified.email);
  if (owner && owner.id !== input.userId) throw new AuthPolicyError("EMAIL_ALREADY_REGISTERED");
  try {
    return await input.db.$transaction(async (tx) => {
      await consumeChallenge(tx, verified.challenge, verified.now);
      return tx.user.update({
        where: { id: input.userId },
        data: { email: verified.email, emailVerified: verified.now },
        select: { id: true, email: true, emailVerified: true },
      });
    });
  } catch (error) {
    return mapUniqueEmail(error);
  }
}

export async function issuePasswordResetChallenge(input: {
  db: PrismaClient;
  email: string;
  requestIp: string;
  deliver: Deliver;
}) {
  const owner = await findEmailOwner(input.db, input.email);
  if (!owner?.email || !owner.emailVerified) {
    await consumeEndpointLimits(input.db, "password-reset-send", input.email, input.requestIp, new Date());
    return { expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS), cooldownSeconds: 60 };
  }
  return issueChallenge({
    ...input,
    email: owner.email,
    purpose: purpose.passwordReset,
    action: "password-reset-send",
  });
}

export async function confirmPasswordReset(input: {
  db: PrismaClient;
  email: string;
  code: string;
  password: string;
  requestIp: string;
}) {
  const owner = await findEmailOwner(input.db, input.email);
  if (!owner?.email || !owner.emailVerified) throw new AuthPolicyError("INVALID_CODE");
  const verified = await verifyChallenge({
    ...input,
    email: owner.email,
    purpose: purpose.passwordReset,
    action: "password-reset-check",
  });
  const passwordHash = await bcrypt.hash(input.password, 12);
  await input.db.$transaction(async (tx) => {
    await consumeChallenge(tx, verified.challenge, verified.now);
    await tx.user.update({ where: { id: owner.id }, data: { passwordHash } });
  });
  return { completed: true };
}

export async function verifyPasswordResetChallenge(input: {
  db: PrismaClient;
  email: string;
  code: string;
  requestIp: string;
  now?: Date;
}) {
  const owner = await findEmailOwner(input.db, input.email);
  if (!owner?.email || !owner.emailVerified) throw new AuthPolicyError("INVALID_CODE");
  await verifyChallenge({
    ...input,
    email: owner.email,
    purpose: purpose.passwordReset,
    action: "password-reset-check",
  });
  return { verified: true };
}

export async function issuePasswordSetupChallenge(input: {
  db: PrismaClient;
  userId: string;
  requestIp: string;
  deliver: Deliver;
  now?: Date;
}) {
  const user = await input.db.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { email: true, emailVerified: true },
  });
  if (!user?.email) throw new AuthPolicyError("EMAIL_REQUIRED");

  return issueChallenge({
    ...input,
    email: user.email,
    purpose: purpose.passwordSetup(input.userId),
    action: "password-setup-send",
  });
}

export async function confirmPasswordSetup(input: {
  db: PrismaClient;
  userId: string;
  code: string;
  password: string;
  requestIp: string;
  now?: Date;
}) {
  const user = await input.db.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user?.email) throw new AuthPolicyError("EMAIL_REQUIRED");

  const verified = await verifyChallenge({
    ...input,
    email: user.email,
    purpose: purpose.passwordSetup(input.userId),
    action: "password-setup-check",
  });
  const passwordHash = await bcrypt.hash(input.password, 12);
  await input.db.$transaction(async (tx) => {
    await consumeChallenge(tx, verified.challenge, verified.now);
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerified: verified.now },
    });
  });
  return { completed: true };
}

export async function verifyPasswordSetupChallenge(input: {
  db: PrismaClient;
  userId: string;
  code: string;
  requestIp: string;
  now?: Date;
}) {
  const user = await input.db.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { email: true },
  });
  if (!user?.email) throw new AuthPolicyError("EMAIL_REQUIRED");
  await verifyChallenge({
    ...input,
    email: user.email,
    purpose: purpose.passwordSetup(input.userId),
    action: "password-setup-check",
  });
  return { verified: true };
}

export async function issueGoogleLinkChallenge(input: {
  db: PrismaClient;
  pendingId: string;
  requestIp: string;
  deliver: Deliver;
}) {
  const pending = await getPendingGoogleLink(input.db, input.pendingId);
  if (!pending.requiresEmailCode) throw new AuthPolicyError("OAUTH_LINK_EXPIRED");
  return issueChallenge({
    db: input.db,
    email: pending.targetUser.email!,
    purpose: purpose.googleLink(pending.id),
    action: "google-link-send",
    requestIp: input.requestIp,
    deliver: input.deliver,
  });
}

export async function confirmGoogleLink(input: {
  db: PrismaClient;
  pendingId: string;
  code: string;
  requestIp: string;
}) {
  const pending = await getPendingGoogleLink(input.db, input.pendingId);
  if (!pending.requiresEmailCode) throw new AuthPolicyError("OAUTH_LINK_EXPIRED");
  const verified = await verifyChallenge({
    db: input.db,
    email: pending.targetUser.email!,
    purpose: purpose.googleLink(pending.id),
    action: "google-link-check",
    code: input.code,
    requestIp: input.requestIp,
  });
  const account = await decryptOAuthAccount(pending.encryptedAccount);
  const rawTicket = await input.db.$transaction(async (tx) => {
    await consumeChallenge(tx, verified.challenge, verified.now);
    const consumed = await tx.pendingOAuthLink.updateMany({
      where: { id: pending.id, consumedAt: null, expiresAt: { gt: verified.now } },
      data: { consumedAt: verified.now },
    });
    if (consumed.count !== 1) throw new AuthPolicyError("OAUTH_LINK_EXPIRED");
    const providerAlreadyLinked = await tx.account.findUnique({
      where: { userId_provider: { userId: pending.targetUserId, provider: account.provider } },
    });
    if (providerAlreadyLinked) throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
    await tx.account.create({
      data: {
        userId: pending.targetUserId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        providerEmail: pending.providerEmail,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state ?? undefined,
      },
    });
    return createLoginTicket(tx, pending.targetUserId);
  });
  return { ticket: rawTicket };
}

export async function issueLineLinkChallenge(input: {
  db: PrismaClient;
  sourceUserId: string;
  email: string;
  requestIp: string;
  deliver: Deliver;
}) {
  const target = await findEmailOwner(input.db, input.email);
  if (!target?.email || !target.emailVerified || target.id === input.sourceUserId) {
    throw new AuthPolicyError("EXISTING_ACCOUNT_NOT_FOUND");
  }
  const source = await input.db.user.findFirst({
    where: { id: input.sourceUserId, deletedAt: null, email: null, accounts: { some: { provider: "line" } } },
    select: { id: true },
  });
  if (!source) throw new AuthPolicyError("LINE_FIRST_USE_NOT_AVAILABLE");
  if (await input.db.account.findUnique({
    where: { userId_provider: { userId: target.id, provider: "line" } },
  })) throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
  return issueChallenge({
    db: input.db,
    email: target.email,
    purpose: purpose.lineLink(source.id, target.id),
    action: "line-link-send",
    requestIp: input.requestIp,
    deliver: input.deliver,
  });
}

export async function confirmLineLink(input: {
  db: PrismaClient;
  sourceUserId: string;
  email: string;
  code: string;
  requestIp: string;
}) {
  const target = await findEmailOwner(input.db, input.email);
  if (!target?.email || target.id === input.sourceUserId) throw new AuthPolicyError("INVALID_CODE");
  const verified = await verifyChallenge({
    db: input.db,
    email: target.email,
    purpose: purpose.lineLink(input.sourceUserId, target.id),
    action: "line-link-check",
    code: input.code,
    requestIp: input.requestIp,
  });
  const ticket = await input.db.$transaction(
    async (tx) => {
      await consumeChallenge(tx, verified.challenge, verified.now);
      await assertLineProvisionalUserIsEmpty(tx, input.sourceUserId);
      const lineAccount = await tx.account.findUnique({
        where: { userId_provider: { userId: input.sourceUserId, provider: "line" } },
      });
      if (!lineAccount) throw new AuthPolicyError("LINE_FIRST_USE_NOT_AVAILABLE");
      if (await tx.account.findUnique({
        where: { userId_provider: { userId: target.id, provider: "line" } },
      })) throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
      await tx.account.update({ where: { id: lineAccount.id }, data: { userId: target.id } });
      await tx.profile.deleteMany({ where: { userId: input.sourceUserId } });
      await tx.notificationPreference.deleteMany({ where: { userId: input.sourceUserId } });
      await tx.user.delete({ where: { id: input.sourceUserId } });
      return createLoginTicket(tx, target.id);
    },
    // The production database is remote. Keep the operation atomic while
    // allowing normal network latency instead of failing at Prisma's 5s default.
    { maxWait: 10_000, timeout: 20_000 },
  );
  return { ticket };
}
