CREATE TYPE "NotificationTypeV2" AS ENUM (
  'MESSAGE_RECEIVED', 'APPLICATION_RECEIVED', 'APPLICATION_ACCEPTED',
  'APPLICATION_DECLINED', 'APPLICATION_CANCELLED', 'APPLICATION_NEED_ENDED',
  'NEED_MATCHED', 'NEED_REOPENED', 'NEED_CLOSED', 'BOOKING_REQUESTED',
  'BOOKING_CONFIRMED', 'BOOKING_DECLINED', 'BOOKING_CANCELLED'
);
CREATE TYPE "NotificationResourceKindV2" AS ENUM ('CONVERSATION', 'APPLICATION', 'BOOKING');

CREATE TABLE "NotificationV2" (
  "id" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "NotificationTypeV2" NOT NULL,
  "resourceKind" "NotificationResourceKindV2" NOT NULL,
  "resourceId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationV2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationV2_eventKey_key" ON "NotificationV2"("eventKey");
CREATE INDEX "NotificationV2_recipientId_readAt_createdAt_id_idx" ON "NotificationV2"("recipientId", "readAt", "createdAt", "id");
CREATE INDEX "NotificationV2_resourceKind_resourceId_idx" ON "NotificationV2"("resourceKind", "resourceId");

ALTER TABLE "NotificationV2" ADD CONSTRAINT "NotificationV2_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
