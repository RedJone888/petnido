-- Need drafts are persisted by PublishDraftV2, so a published NeedV2 only
-- needs the three lifecycle states below. Retire historical draft/cancelled
-- rows before replacing the enum; archivedAt remains the deletion boundary.
UPDATE "NeedV2"
SET "state" = 'CLOSED',
    "archivedAt" = COALESCE("archivedAt", CURRENT_TIMESTAMP)
WHERE "state" IN ('DRAFT', 'CANCELLED');

CREATE TYPE "NeedStateV2_new" AS ENUM ('OPEN', 'MATCHED', 'CLOSED');

ALTER TABLE "NeedV2"
  ALTER COLUMN "state" DROP DEFAULT,
  ALTER COLUMN "state" TYPE "NeedStateV2_new"
    USING ("state"::text::"NeedStateV2_new");

DROP TYPE "NeedStateV2";
ALTER TYPE "NeedStateV2_new" RENAME TO "NeedStateV2";

ALTER TABLE "NeedV2"
  ALTER COLUMN "state" SET DEFAULT 'OPEN';
