ALTER TABLE "Account" ADD COLUMN "providerEmail" TEXT;

ALTER TABLE "PendingOAuthLink"
ADD COLUMN "providerEmail" TEXT,
ADD COLUMN "requiresEmailCode" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "OAuthConnectIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthConnectIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OAuthConnectIntent_tokenHash_key"
ON "OAuthConnectIntent"("tokenHash");
CREATE INDEX "OAuthConnectIntent_userId_expiresAt_idx"
ON "OAuthConnectIntent"("userId", "expiresAt");

ALTER TABLE "OAuthConnectIntent" ADD CONSTRAINT "OAuthConnectIntent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
