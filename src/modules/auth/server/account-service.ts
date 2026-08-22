import bcrypt from "bcryptjs";
import type { Prisma, PrismaClient } from "@prisma/client";

import { AuthPolicyError } from "./errors";

export type UnlinkableOAuthProvider = "google" | "line";

export function hasAlternativeSignInMethod(
  input: {
    hasPasswordLogin: boolean;
    providers: string[];
  },
  providerToRemove: UnlinkableOAuthProvider,
) {
  return (
    input.hasPasswordLogin ||
    input.providers.some(
      (provider) =>
        (provider === "google" || provider === "line") &&
        provider !== providerToRemove,
    )
  );
}

export function isRecentOtherOAuthAuthentication(
  input: { authenticatedAt?: number; authenticatedProvider?: string },
  providerToRemove: UnlinkableOAuthProvider,
  now: Date,
) {
  return Boolean(
    input.authenticatedAt &&
      now.getTime() - input.authenticatedAt <= 10 * 60 * 1000 &&
      (input.authenticatedProvider === "google" ||
        input.authenticatedProvider === "line") &&
      input.authenticatedProvider !== providerToRemove,
  );
}

export async function assertLineProvisionalUserIsEmpty(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  // An interactive transaction uses one database connection. Promise.all does
  // not make these checks parallel and made the remote-database flow prone to
  // Prisma's default five-second transaction timeout. One EXISTS query is both
  // faster and a more complete guard against accidentally merging two users.
  const userWithBusinessData = await tx.user.findFirst({
    where: {
      id: userId,
      OR: [
        { pets: { some: {} } },
        { needs: { some: {} } },
        { serviceProfile: { isNot: null } },
        { locations: { some: {} } },
        { attachment: { some: {} } },
        { applications: { some: {} } },
        { sittings: { some: {} } },
        { ownerBookings: { some: {} } },
        { messagesSent: { some: {} } },
        { messagesReceived: { some: {} } },
        { publishDraftsV2: { some: {} } },
        { needsV2: { some: {} } },
        { favoritesV2: { some: {} } },
        { conversationsCreatedV2: { some: {} } },
        { conversationMembersV2: { some: {} } },
        { messagesV2: { some: {} } },
        { applicationsSubmittedV2: { some: {} } },
        { applicationsReceivedV2: { some: {} } },
        { bookingsRequestedV2: { some: {} } },
        { bookingsReceivedV2: { some: {} } },
      ],
    },
    select: { id: true },
  });
  if (userWithBusinessData) {
    throw new AuthPolicyError("LINE_ACCOUNT_ALREADY_IN_USE");
  }
}

export async function completeLineAsNewAccount(db: PrismaClient, userId: string) {
  const user = await db.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      email: null,
      passwordHash: null,
      accounts: { some: { provider: "line" } },
    },
    select: { id: true },
  });
  if (!user) throw new AuthPolicyError("LINE_FIRST_USE_NOT_AVAILABLE");
  await db.profile.upsert({
    where: { userId },
    update: { lineFirstUseCompletedAt: new Date() },
    create: { userId, lineFirstUseCompletedAt: new Date() },
  });
  return { completed: true };
}

export async function getAccountOverview(db: PrismaClient, userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      passwordHash: true,
      accounts: { select: { provider: true, providerEmail: true } },
    },
  });
  return {
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    hasPassword: Boolean(user.email && user.emailVerified && user.passwordHash),
    providers: user.accounts.map((account) => account.provider),
    providerEmails: Object.fromEntries(
      user.accounts.map((account) => [
        account.provider,
        account.providerEmail ?? (account.provider === "google" ? user.email : null),
      ]),
    ) as Record<string, string | null>,
  };
}

export async function unlinkOAuthProvider(
  db: PrismaClient,
  input: {
    userId: string;
    provider: UnlinkableOAuthProvider;
    password?: string;
    authenticatedAt?: number;
    authenticatedProvider?: string;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();

  return db.$transaction(
    async (tx) => {
      // Updating the owning row serializes concurrent unlink requests for this
      // user, so two providers cannot both pass the "one method left" check.
      const user = await tx.user.update({
        where: { id: input.userId },
        data: { updatedAt: now },
        select: {
          deletedAt: true,
          email: true,
          emailVerified: true,
          passwordHash: true,
          accounts: { select: { id: true, provider: true } },
        },
      });
      if (user.deletedAt) throw new AuthPolicyError("USER_NOT_FOUND");

      const providerAccount = user.accounts.find(
        (account) => account.provider === input.provider,
      );
      if (!providerAccount) throw new AuthPolicyError("PROVIDER_NOT_LINKED");

      const hasPasswordLogin = Boolean(
        user.email && user.emailVerified && user.passwordHash,
      );
      if (
        !hasAlternativeSignInMethod(
          {
            hasPasswordLogin,
            providers: user.accounts.map((account) => account.provider),
          },
          input.provider,
        )
      ) {
        throw new AuthPolicyError("LAST_SIGN_IN_METHOD");
      }

      let passwordConfirmed = false;
      if (input.password && hasPasswordLogin) {
        passwordConfirmed = await bcrypt.compare(
          input.password,
          user.passwordHash!,
        );
        if (!passwordConfirmed) {
          throw new AuthPolicyError("INVALID_CREDENTIALS");
        }
      }
      const otherOAuthConfirmed = isRecentOtherOAuthAuthentication(
        {
          authenticatedAt: input.authenticatedAt,
          authenticatedProvider: input.authenticatedProvider,
        },
        input.provider,
        now,
      );
      if (!passwordConfirmed && !otherOAuthConfirmed) {
        throw new AuthPolicyError("REAUTH_REQUIRED");
      }

      await tx.account.delete({ where: { id: providerAccount.id } });
      return { provider: input.provider, unlinked: true as const };
    },
    { maxWait: 10_000, timeout: 15_000 },
  );
}

export async function deleteAccount(
  db: PrismaClient,
  input: { userId: string; password?: string; authenticatedAt?: number },
) {
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user || user.deletedAt) throw new AuthPolicyError("USER_NOT_FOUND");
  if (user.passwordHash) {
    if (!input.password || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AuthPolicyError("INVALID_CREDENTIALS");
    }
  } else if (!input.authenticatedAt || Date.now() - input.authenticatedAt > 10 * 60 * 1000) {
    throw new AuthPolicyError("REAUTH_REQUIRED");
  }

  const [legacyApplications, legacyBookings, applicationsV2, bookingsV2] = await Promise.all([
    db.application.count({
      where: { sitterId: input.userId, status: { in: ["PENDING", "ACCEPTED"] } },
    }),
    db.booking.count({
      where: {
        OR: [{ ownerId: input.userId }, { sitterId: input.userId }],
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    db.needApplicationV2.count({
      where: {
        OR: [{ ownerId: input.userId }, { applicantId: input.userId }],
        state: { in: ["PENDING", "ACCEPTED"] },
      },
    }),
    db.serviceBookingV2.count({
      where: {
        OR: [{ providerId: input.userId }, { customerId: input.userId }],
        state: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);
  if ([legacyApplications, legacyBookings, applicationsV2, bookingsV2].some(Boolean)) {
    throw new AuthPolicyError("ACCOUNT_HAS_ACTIVE_OBLIGATIONS");
  }

  const deletedAt = new Date();
  await db.$transaction(async (tx) => {
    await tx.account.deleteMany({ where: { userId: input.userId } });
    await tx.session.deleteMany({ where: { userId: input.userId } });
    await tx.pendingOAuthLink.deleteMany({ where: { targetUserId: input.userId } });
    await tx.authLoginTicket.deleteMany({ where: { userId: input.userId } });
    await tx.notificationPreference.upsert({
      where: { userId: input.userId },
      update: { emailInstant: false },
      create: { userId: input.userId, emailInstant: false },
    });
    await tx.emailOutboxV2.updateMany({
      where: { recipientId: input.userId, state: { in: ["PENDING", "PROCESSING"] } },
      data: { state: "CANCELLED", lockedAt: null },
    });
    await tx.profile.updateMany({ where: { userId: input.userId }, data: { bio: null } });
    await tx.user.update({
      where: { id: input.userId },
      data: {
        name: "Deleted user",
        email: null,
        emailVerified: null,
        passwordHash: null,
        image: null,
        avatarAttachmentId: null,
        deletedAt,
      },
    });
  });
  return { deletedAt };
}
