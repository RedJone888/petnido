CREATE TYPE "NeedApplicationStateV2" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'NEED_ENDED');

CREATE TABLE "NeedApplicationV2" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "needSource" "ConversationContextSourceV2" NOT NULL,
  "needId" TEXT NOT NULL,
  "needTitleSnapshot" TEXT NOT NULL,
  "needModeSnapshot" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "state" "NeedApplicationStateV2" NOT NULL DEFAULT 'PENDING',
  "decidedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NeedApplicationV2_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NeedApplicationV2_idempotencyKey_key" ON "NeedApplicationV2"("idempotencyKey");
CREATE UNIQUE INDEX "NeedApplicationV2_needSource_needId_applicantId_key" ON "NeedApplicationV2"("needSource", "needId", "applicantId");
CREATE UNIQUE INDEX "NeedApplicationV2_one_accepted_per_need_key" ON "NeedApplicationV2"("needSource", "needId") WHERE "state" = 'ACCEPTED';
CREATE INDEX "NeedApplicationV2_ownerId_state_createdAt_idx" ON "NeedApplicationV2"("ownerId", "state", "createdAt");
CREATE INDEX "NeedApplicationV2_applicantId_state_createdAt_idx" ON "NeedApplicationV2"("applicantId", "state", "createdAt");
CREATE INDEX "NeedApplicationV2_needSource_needId_state_idx" ON "NeedApplicationV2"("needSource", "needId", "state");
CREATE INDEX "NeedApplicationV2_conversationId_idx" ON "NeedApplicationV2"("conversationId");

ALTER TABLE "NeedApplicationV2" ADD CONSTRAINT "NeedApplicationV2_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NeedApplicationV2" ADD CONSTRAINT "NeedApplicationV2_applicantId_fkey"
FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NeedApplicationV2" ADD CONSTRAINT "NeedApplicationV2_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "ConversationV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
