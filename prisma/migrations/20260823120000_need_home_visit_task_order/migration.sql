-- Store home-visit task display order per visit.  The order is deliberately
-- separate from NeedTaskV2 so changing Visit 2 never changes Visit 1 and does
-- not participate in the semantic task fingerprint.
CREATE TABLE "HomeVisitTaskOrderV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "visitNumber" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "HomeVisitTaskOrderV2_pkey" PRIMARY KEY ("id")
);

-- Preserve the legacy task order for every visit while new clients begin to
-- send visit-specific values. DISTINCT protects the unique relation when a
-- legacy visitNumbers array contains a duplicated visit number. The
-- deterministic fallback id keeps this expand migration repeatable during
-- database restore tooling.
INSERT INTO "HomeVisitTaskOrderV2" ("id", "needId", "taskId", "visitNumber", "order")
SELECT DISTINCT
  'legacy-visit-order:' || task."id" || ':' || visits.visit_number::text,
  task."needId",
  task."id",
  visits.visit_number,
  task."order"
FROM "NeedTaskV2" AS task
JOIN "NeedV2" AS need ON need."id" = task."needId"
CROSS JOIN LATERAL unnest(task."visitNumbers") AS visits(visit_number)
WHERE need."mode" = 'HOME_VISIT' AND visits.visit_number > 0;

-- The legacy global order has now been copied into the per-visit rows.  Keep
-- it only for boarding/custom tasks; HOME_VISIT must not retain a misleading
-- global fallback once the per-visit relation is available.
ALTER TABLE "NeedTaskV2"
  ALTER COLUMN "order" DROP NOT NULL;

UPDATE "NeedTaskV2" AS task
SET "order" = NULL
FROM "NeedV2" AS need
WHERE need."id" = task."needId"
  AND need."mode" = 'HOME_VISIT';

CREATE UNIQUE INDEX "HomeVisitTaskOrderV2_needId_taskId_visitNumber_key"
  ON "HomeVisitTaskOrderV2"("needId", "taskId", "visitNumber");
CREATE INDEX "HomeVisitTaskOrderV2_needId_visitNumber_order_idx"
  ON "HomeVisitTaskOrderV2"("needId", "visitNumber", "order");
CREATE INDEX "HomeVisitTaskOrderV2_taskId_visitNumber_idx"
  ON "HomeVisitTaskOrderV2"("taskId", "visitNumber");

ALTER TABLE "HomeVisitTaskOrderV2"
  ADD CONSTRAINT "HomeVisitTaskOrderV2_needId_fkey"
  FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeVisitTaskOrderV2"
  ADD CONSTRAINT "HomeVisitTaskOrderV2_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "NeedTaskV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomeVisitTaskOrderV2"
  ADD CONSTRAINT "HomeVisitTaskOrderV2_value_check"
  CHECK ("visitNumber" > 0 AND "order" >= 0);
