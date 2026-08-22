CREATE TYPE "ConversationContextKindV2" AS ENUM ('NEED', 'SERVICE');
CREATE TYPE "ConversationContextSourceV2" AS ENUM ('V2', 'LEGACY');
CREATE TYPE "MessageKindV2" AS ENUM ('USER', 'SYSTEM');

CREATE TABLE "ConversationV2" (
  "id" TEXT NOT NULL,
  "contextKind" "ConversationContextKindV2" NOT NULL,
  "contextSource" "ConversationContextSourceV2" NOT NULL,
  "contextId" TEXT NOT NULL,
  "contextTitle" TEXT NOT NULL,
  "contextMode" TEXT,
  "participantPairKey" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConversationV2_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationParticipantV2" (
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReadAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "ConversationParticipantV2_pkey" PRIMARY KEY ("conversationId", "userId")
);

CREATE TABLE "MessageV2" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT,
  "kind" "MessageKindV2" NOT NULL DEFAULT 'USER',
  "body" TEXT NOT NULL,
  "systemCode" TEXT,
  "clientMessageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageV2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConversationV2_contextKind_contextSource_contextId_participantPairKey_key"
ON "ConversationV2"("contextKind", "contextSource", "contextId", "participantPairKey");
CREATE INDEX "ConversationV2_lastMessageAt_id_idx" ON "ConversationV2"("lastMessageAt", "id");
CREATE INDEX "ConversationV2_contextKind_contextSource_contextId_idx" ON "ConversationV2"("contextKind", "contextSource", "contextId");
CREATE INDEX "ConversationParticipantV2_userId_archivedAt_conversationId_idx" ON "ConversationParticipantV2"("userId", "archivedAt", "conversationId");
CREATE UNIQUE INDEX "MessageV2_conversationId_clientMessageId_key" ON "MessageV2"("conversationId", "clientMessageId");
CREATE INDEX "MessageV2_conversationId_createdAt_id_idx" ON "MessageV2"("conversationId", "createdAt", "id");
CREATE INDEX "MessageV2_senderId_createdAt_idx" ON "MessageV2"("senderId", "createdAt");

ALTER TABLE "ConversationV2" ADD CONSTRAINT "ConversationV2_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipantV2" ADD CONSTRAINT "ConversationParticipantV2_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ConversationV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipantV2" ADD CONSTRAINT "ConversationParticipantV2_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MessageV2" ADD CONSTRAINT "MessageV2_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ConversationV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageV2" ADD CONSTRAINT "MessageV2_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
