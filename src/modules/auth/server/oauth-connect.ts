import { createHash, randomBytes } from "crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import type { Account } from "next-auth";

import { normalizeEmail } from "../shared/email";
import { AuthPolicyError } from "./errors";
import {
  createPendingGoogleLink,
  decryptOAuthAccount,
  getPendingGoogleLink,
} from "./oauth-link";

export type ConnectableOAuthProvider = "google" | "line";

export function oauthConnectCookie(provider: ConnectableOAuthProvider) {
  return `petnido_${provider}_connect`;
}

export function oauthConnectCookiePath(provider: ConnectableOAuthProvider) {
  return `/api/auth/callback/${provider}`;
}
const CONNECT_INTENT_TTL_MS = 5 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function evaluateGoogleConnectOwnership(input: {
  targetUserId: string;
  identityOwnerUserId?: string | null;
  emailOwnerUserId?: string | null;
  emailOwnerDeleted?: boolean;
}) {
  if (input.identityOwnerUserId === input.targetUserId) return "already-linked" as const;
  if (input.identityOwnerUserId) throw new AuthPolicyError("GOOGLE_ACCOUNT_IN_USE");
  if (
    input.emailOwnerUserId &&
    !input.emailOwnerDeleted &&
    input.emailOwnerUserId !== input.targetUserId
  ) {
    throw new AuthPolicyError("GOOGLE_EMAIL_IN_USE");
  }
  return "available" as const;
}

export function evaluateLineConnectOwnership(input: {
  targetUserId: string;
  identityOwnerUserId?: string | null;
}) {
  if (input.identityOwnerUserId === input.targetUserId) return "already-linked" as const;
  if (input.identityOwnerUserId) throw new AuthPolicyError("LINE_ACCOUNT_IN_USE");
  return "available" as const;
}

export async function createOAuthConnectIntent(
  db: PrismaClient,
  userId: string,
  provider: ConnectableOAuthProvider,
) {
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      accounts: { where: { provider }, select: { id: true }, take: 1 },
    },
  });
  if (!user) throw new AuthPolicyError("USER_NOT_FOUND");
  if (user.accounts.length) throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");

  const rawToken = randomBytes(32).toString("base64url");
  await db.oAuthConnectIntent.create({
    data: {
      userId,
      provider,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + CONNECT_INTENT_TTL_MS),
    },
  });
  return rawToken;
}

export function createGoogleConnectIntent(db: PrismaClient, userId: string) {
  return createOAuthConnectIntent(db, userId, "google");
}

async function consumeIntent(db: PrismaClient, id: string, now = new Date()) {
  return db.oAuthConnectIntent.updateMany({
    where: { id, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });
}

export async function prepareGoogleConnect(input: {
  db: PrismaClient;
  rawToken: string;
  account: Account;
  googleEmail: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const intent = await input.db.oAuthConnectIntent.findUnique({
    where: { tokenHash: hashToken(input.rawToken) },
    include: { user: { select: { id: true, deletedAt: true } } },
  });
  if (
    !intent ||
    intent.provider !== "google" ||
    intent.consumedAt ||
    intent.expiresAt <= now ||
    intent.user.deletedAt
  ) {
    throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");
  }

  const googleEmail = normalizeEmail(input.googleEmail);
  const identityOwner = await input.db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: input.account.providerAccountId,
      },
    },
    select: { userId: true },
  });
  const emailOwner = await input.db.user.findUnique({
    where: { email: googleEmail },
    select: { id: true, deletedAt: true },
  });
  let ownership: ReturnType<typeof evaluateGoogleConnectOwnership>;
  try {
    ownership = evaluateGoogleConnectOwnership({
      targetUserId: intent.userId,
      identityOwnerUserId: identityOwner?.userId,
      emailOwnerUserId: emailOwner?.id,
      emailOwnerDeleted: Boolean(emailOwner?.deletedAt),
    });
  } catch (error) {
    await consumeIntent(input.db, intent.id, now);
    throw error;
  }
  if (ownership === "already-linked") {
    await consumeIntent(input.db, intent.id, now);
    return { status: "already-linked" as const };
  }

  const existingGoogle = await input.db.account.findUnique({
    where: { userId_provider: { userId: intent.userId, provider: "google" } },
    select: { id: true },
  });
  if (existingGoogle) {
    await consumeIntent(input.db, intent.id, now);
    throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
  }

  const consumed = await consumeIntent(input.db, intent.id, now);
  if (consumed.count !== 1) throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");

  const pending = await createPendingGoogleLink(input.db, {
    targetUserId: intent.userId,
    account: input.account,
    providerEmail: googleEmail,
    requiresEmailCode: false,
  });
  return { status: "confirmation-required" as const, pendingId: pending.id };
}

export async function connectLineFromIntent(input: {
  db: PrismaClient;
  rawToken: string;
  account: Account;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const intent = await input.db.oAuthConnectIntent.findUnique({
    where: { tokenHash: hashToken(input.rawToken) },
    include: { user: { select: { id: true, deletedAt: true } } },
  });
  if (
    !intent ||
    intent.provider !== "line" ||
    intent.consumedAt ||
    intent.expiresAt <= now ||
    intent.user.deletedAt
  ) {
    throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");
  }

  try {
    return await input.db.$transaction(
      async (tx) => {
        const identityOwner = await tx.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "line",
              providerAccountId: input.account.providerAccountId,
            },
          },
          select: { userId: true },
        });

        const consumed = await tx.oAuthConnectIntent.updateMany({
          where: { id: intent.id, consumedAt: null, expiresAt: { gt: now } },
          data: { consumedAt: now },
        });
        if (consumed.count !== 1) throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");
        const ownership = evaluateLineConnectOwnership({
          targetUserId: intent.userId,
          identityOwnerUserId: identityOwner?.userId,
        });
        if (ownership === "already-linked") {
          return { status: "already-linked" as const };
        }

        const existingLine = await tx.account.findUnique({
          where: { userId_provider: { userId: intent.userId, provider: "line" } },
          select: { id: true },
        });
        if (existingLine) throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");

        const activeUser = await tx.user.findFirst({
          where: { id: intent.userId, deletedAt: null },
          select: { id: true },
        });
        if (!activeUser) throw new AuthPolicyError("USER_NOT_FOUND");

        await tx.account.create({
          data: {
            userId: intent.userId,
            type: input.account.type,
            provider: "line",
            providerAccountId: input.account.providerAccountId,
            refresh_token: input.account.refresh_token,
            access_token: input.account.access_token,
            expires_at: input.account.expires_at,
            token_type: input.account.token_type,
            scope: input.account.scope,
            id_token: input.account.id_token,
            session_state: input.account.session_state ?? undefined,
          },
        });
        return { status: "connected" as const };
      },
      { maxWait: 10_000, timeout: 15_000 },
    );
  } catch (error) {
    if (error instanceof AuthPolicyError) {
      await consumeIntent(input.db, intent.id, now);
      throw error;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await consumeIntent(input.db, intent.id, now);
      throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
    }
    throw error;
  }
}

export async function confirmGoogleConnect(input: {
  db: PrismaClient;
  pendingId: string;
  userId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const pending = await getPendingGoogleLink(input.db, input.pendingId);
  if (
    pending.requiresEmailCode ||
    pending.targetUserId !== input.userId ||
    !pending.providerEmail
  ) {
    throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");
  }
  const account = await decryptOAuthAccount(pending.encryptedAccount);
  const providerEmail = normalizeEmail(pending.providerEmail);

  try {
    await input.db.$transaction(
      async (tx) => {
        const user = await tx.user.update({
          where: { id: input.userId },
          data: { updatedAt: now },
          select: { deletedAt: true },
        });
        if (user.deletedAt) throw new AuthPolicyError("USER_NOT_FOUND");

        const identityOwner = await tx.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: account.providerAccountId,
            },
          },
          select: { userId: true },
        });
        if (identityOwner?.userId === input.userId) {
          throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
        }
        if (identityOwner) throw new AuthPolicyError("GOOGLE_ACCOUNT_IN_USE");

        const emailOwner = await tx.user.findUnique({
          where: { email: providerEmail },
          select: { id: true, deletedAt: true },
        });
        if (emailOwner && !emailOwner.deletedAt && emailOwner.id !== input.userId) {
          throw new AuthPolicyError("GOOGLE_EMAIL_IN_USE");
        }

        const consumed = await tx.pendingOAuthLink.updateMany({
          where: { id: pending.id, consumedAt: null, expiresAt: { gt: now } },
          data: { consumedAt: now },
        });
        if (consumed.count !== 1) throw new AuthPolicyError("OAUTH_CONNECT_EXPIRED");

        await tx.account.create({
          data: {
            userId: input.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            providerEmail,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state ?? undefined,
          },
        });
      },
      { maxWait: 10_000, timeout: 15_000 },
    );
  } catch (error) {
    if (error instanceof AuthPolicyError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AuthPolicyError("PROVIDER_ALREADY_LINKED");
    }
    throw error;
  }

  return { connected: true as const, provider: "google" as const, providerEmail };
}
