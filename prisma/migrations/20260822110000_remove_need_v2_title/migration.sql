-- NeedV2 titles were derived from mode/pet labels and changed with the
-- publishing language. They are no longer persisted; all consumers derive a
-- display title from canonical snapshots at read time.
ALTER TABLE "NeedV2" DROP COLUMN IF EXISTS "title";
