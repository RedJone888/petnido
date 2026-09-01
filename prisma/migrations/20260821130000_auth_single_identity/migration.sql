-- LINE identity belongs in Account, never in a synthetic email address.
UPDATE "User"
SET "email" = NULL, "emailVerified" = NULL
WHERE "email" LIKE '%@line.oauth';

UPDATE "User" SET "email" = LOWER(TRIM("email")) WHERE "email" IS NOT NULL;

-- If historical rows differ only by case this deliberately fails: PetNido
-- does not guess which business-data owner should survive or merge accounts.
CREATE UNIQUE INDEX "User_email_case_insensitive_key"
ON "User" (LOWER("email")) WHERE "email" IS NOT NULL;

ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Profile" ADD COLUMN "lineFirstUseCompletedAt" TIMESTAMP(3);
UPDATE "Profile" SET "lineFirstUseCompletedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "NotificationPreference"
ALTER COLUMN "emailInstant" SET DEFAULT false;

CREATE TABLE "PendingOAuthLink" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "encryptedAccount" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingOAuthLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthLoginTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthLoginTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingOAuthLink_provider_providerAccountId_key"
ON "PendingOAuthLink"("provider", "providerAccountId");
CREATE INDEX "PendingOAuthLink_targetUserId_expiresAt_idx"
ON "PendingOAuthLink"("targetUserId", "expiresAt");
CREATE UNIQUE INDEX "AuthLoginTicket_tokenHash_key"
ON "AuthLoginTicket"("tokenHash");
CREATE INDEX "AuthLoginTicket_userId_expiresAt_idx"
ON "AuthLoginTicket"("userId", "expiresAt");
CREATE UNIQUE INDEX "Account_userId_provider_key"
ON "Account"("userId", "provider");

ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PendingOAuthLink" ADD CONSTRAINT "PendingOAuthLink_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthLoginTicket" ADD CONSTRAINT "AuthLoginTicket_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
