CREATE TYPE "EmailOutboxStateV2" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

ALTER TABLE "NotificationPreference" ADD COLUMN "emailPromptedAt" TIMESTAMP(3);

CREATE TABLE "EmailOutboxV2" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "state" "EmailOutboxStateV2" NOT NULL DEFAULT 'PENDING',
  "locale" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailOutboxV2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailOutboxV2_notificationId_key" ON "EmailOutboxV2"("notificationId");
CREATE INDEX "EmailOutboxV2_state_availableAt_createdAt_idx" ON "EmailOutboxV2"("state", "availableAt", "createdAt");
CREATE INDEX "EmailOutboxV2_recipientId_state_createdAt_idx" ON "EmailOutboxV2"("recipientId", "state", "createdAt");

ALTER TABLE "EmailOutboxV2" ADD CONSTRAINT "EmailOutboxV2_notificationId_fkey"
FOREIGN KEY ("notificationId") REFERENCES "NotificationV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailOutboxV2" ADD CONSTRAINT "EmailOutboxV2_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailOutboxV2" ADD CONSTRAINT "EmailOutboxV2_attempts_check"
CHECK ("attempts" >= 0 AND "attempts" <= 5);
