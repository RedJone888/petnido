ALTER TABLE "NeedPetSnapshotV2"
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Published drafts retain the original pets array, so use it to restore the
-- display order for existing requests wherever that source is available.
UPDATE "NeedPetSnapshotV2" AS snapshot
SET "order" = ordered.position
FROM (
  SELECT DISTINCT ON (pet_snapshot."id")
    pet_snapshot."id",
    (pet_entry.ordinality - 1)::INTEGER AS position
  FROM "NeedPetSnapshotV2" AS pet_snapshot
  INNER JOIN "PublishDraftV2" AS draft
    ON draft."publishedNeedId" = pet_snapshot."needId"
    OR draft."editingNeedId" = pet_snapshot."needId"
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(draft."payloadJson"::jsonb -> 'pets') = 'array'
        THEN draft."payloadJson"::jsonb -> 'pets'
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS pet_entry(value, ordinality)
  WHERE pet_entry.value ->> 'clientPetKey' = pet_snapshot."clientPetKey"
  ORDER BY
    pet_snapshot."id",
    draft."publishedAt" DESC NULLS LAST,
    draft."updatedAt" DESC
) AS ordered
WHERE snapshot."id" = ordered."id";

CREATE INDEX "NeedPetSnapshotV2_needId_order_idx"
ON "NeedPetSnapshotV2"("needId", "order");
