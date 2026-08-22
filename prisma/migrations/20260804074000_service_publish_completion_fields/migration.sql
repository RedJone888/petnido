-- Expand-only completion fields for idempotent Service V2 publishing and edit drafts.
ALTER TABLE "ServiceV2" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "ServiceV2_idempotencyKey_key"
ON "ServiceV2"("idempotencyKey");

ALTER TABLE "PublishDraftV2" ADD COLUMN "editingServiceId" TEXT;

CREATE INDEX "PublishDraftV2_ownerId_editingServiceId_status_idx"
ON "PublishDraftV2"("ownerId", "editingServiceId", "status");

-- Existing V2 services must be absent or backfilled before this final statement is
-- applied in staging/production. The deployment gate checks that precondition.
ALTER TABLE "ServiceV2" ALTER COLUMN "idempotencyKey" SET NOT NULL;
