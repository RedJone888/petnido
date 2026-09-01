-- Additive edit-draft link. This intentionally starts as a scalar reference;
-- owner and target existence are verified by the edit command transaction.
ALTER TABLE "PublishDraftV2"
ADD COLUMN "editingNeedId" TEXT;

CREATE INDEX "PublishDraftV2_ownerId_editingNeedId_status_idx"
ON "PublishDraftV2"("ownerId", "editingNeedId", "status");
