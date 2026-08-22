-- Additive follow-up for grouped legacy pet entries. Saved pet profiles remain
-- individual records; an unlinked published snapshot may represent a group.
ALTER TABLE "NeedPetSnapshotV2"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "NeedPetSnapshotV2"
ADD CONSTRAINT "NeedPetSnapshotV2_quantity_check"
CHECK ("quantity" > 0 AND "quantity" <= 100);
