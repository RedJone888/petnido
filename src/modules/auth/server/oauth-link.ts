import { createHash } from "crypto";
import type { Account } from "next-auth";
import { CompactEncrypt, compactDecrypt } from "jose";
import type { PrismaClient } from "@prisma/client";

import { AuthPolicyError } from "./errors";

function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET_REQUIRED");
    return createHash("sha256").update("petnido-development-auth-secret").digest();
  }
  return createHash("sha256").update(secret).digest();
}

export type StoredOAuthAccount = Pick<
  Account,
  | "type"
  | "provider"
  | "providerAccountId"
  | "refresh_token"
  | "access_token"
  | "expires_at"
  | "token_type"
  | "scope"
  | "id_token"
  | "session_state"
>;

export async function encryptOAuthAccount(account: Account) {
  const payload: StoredOAuthAccount = {
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token,
    access_token: account.access_token,
    expires_at: account.expires_at,
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: account.session_state,
  };
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(encryptionKey());
}

export async function decryptOAuthAccount(value: string): Promise<StoredOAuthAccount> {
  const { plaintext } = await compactDecrypt(value, encryptionKey());
  return JSON.parse(new TextDecoder().decode(plaintext)) as StoredOAuthAccount;
}

export async function createPendingGoogleLink(
  db: PrismaClient,
  input: {
    targetUserId: string;
    account: Account;
    providerEmail?: string | null;
    requiresEmailCode?: boolean;
  },
) {
  const encryptedAccount = await encryptOAuthAccount(input.account);
  return db.pendingOAuthLink.upsert({
    where: {
      provider_providerAccountId: {
        provider: input.account.provider,
        providerAccountId: input.account.providerAccountId,
      },
    },
    update: {
      targetUserId: input.targetUserId,
      providerEmail: input.providerEmail ?? null,
      requiresEmailCode: input.requiresEmailCode ?? true,
      encryptedAccount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      consumedAt: null,
    },
    create: {
      targetUserId: input.targetUserId,
      provider: input.account.provider,
      providerAccountId: input.account.providerAccountId,
      providerEmail: input.providerEmail ?? null,
      requiresEmailCode: input.requiresEmailCode ?? true,
      encryptedAccount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    select: { id: true },
  });
}

export async function getPendingGoogleLink(db: PrismaClient, pendingId: string) {
  const pending = await db.pendingOAuthLink.findUnique({
    where: { id: pendingId },
    include: { targetUser: { select: { email: true, deletedAt: true } } },
  });
  if (
    !pending ||
    pending.provider !== "google" ||
    pending.consumedAt ||
    pending.expiresAt <= new Date() ||
    pending.targetUser.deletedAt ||
    (pending.requiresEmailCode && !pending.targetUser.email)
  ) {
    throw new AuthPolicyError("OAUTH_LINK_EXPIRED");
  }
  return pending;
}
