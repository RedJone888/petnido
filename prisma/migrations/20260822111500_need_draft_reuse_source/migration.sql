ALTER TABLE "PublishDraftV2"
  ADD COLUMN "clonedFromNeedId" TEXT;

CREATE INDEX "PublishDraftV2_ownerId_clonedFromNeedId_idx"
  ON "PublishDraftV2"("ownerId", "clonedFromNeedId");
