CREATE TABLE "NeedPetSnapshotV2Attachment" (
  "petSnapshotId" TEXT NOT NULL,
  "attachmentId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "NeedPetSnapshotV2Attachment_pkey"
    PRIMARY KEY ("petSnapshotId", "attachmentId"),
  CONSTRAINT "NeedPetSnapshotV2Attachment_petSnapshotId_fkey"
    FOREIGN KEY ("petSnapshotId") REFERENCES "NeedPetSnapshotV2"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NeedPetSnapshotV2Attachment_attachmentId_fkey"
    FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NeedPetSnapshotV2Attachment_petSnapshotId_order_key"
ON "NeedPetSnapshotV2Attachment"("petSnapshotId", "order");

CREATE INDEX "NeedPetSnapshotV2Attachment_attachmentId_idx"
ON "NeedPetSnapshotV2Attachment"("attachmentId");

-- Backfill published pet snapshots from the active attachments of their
-- source pet. The ordering is frozen on the request snapshot.
INSERT INTO "NeedPetSnapshotV2Attachment" (
  "petSnapshotId",
  "attachmentId",
  "order"
)
SELECT
  snapshot."id",
  attachment."id",
  ROW_NUMBER() OVER (
    PARTITION BY snapshot."id"
    ORDER BY attachment."order", attachment."createdAt", attachment."id"
  ) - 1
FROM "NeedPetSnapshotV2" AS snapshot
JOIN "Attachment" AS attachment
  ON attachment."petId" = snapshot."sourcePetId"
WHERE attachment."status" = 1;
