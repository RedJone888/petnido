ALTER TABLE "LocationSnapshotV2"
ADD COLUMN "label" TEXT;

-- Existing V2 snapshots already retain the selected saved-location id. Use
-- that source to recover the full display label, then fall back to the public
-- region for snapshots without a saved source.
UPDATE "LocationSnapshotV2" AS snapshot
SET "label" = COALESCE(
  NULLIF(BTRIM(saved_location."label"), ''),
  snapshot."regionLabel"
)
FROM "UserLocation" AS saved_location
WHERE snapshot."sourceLocationId" = saved_location."id";

UPDATE "LocationSnapshotV2"
SET "label" = "regionLabel"
WHERE "label" IS NULL;
