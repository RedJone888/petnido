-- Allow scheduleKind and priority to be nullable on NeedTaskV2, matching the schema and multi-mode task semantics.
ALTER TABLE "NeedTaskV2" DROP CONSTRAINT IF EXISTS "NeedTaskV2_schedule_check";

ALTER TABLE "NeedTaskV2" ALTER COLUMN "scheduleKind" DROP NOT NULL;
ALTER TABLE "NeedTaskV2" ALTER COLUMN "priority" DROP NOT NULL;

ALTER TABLE "NeedTaskV2" ADD CONSTRAINT "NeedTaskV2_schedule_check"
CHECK (
  "order" >= 0 AND
  (
    "scheduleKind" IS NULL OR
    ("scheduleKind" = 'EACH_VISIT' AND cardinality("visitNumbers") > 0) OR
    ("scheduleKind" IN ('DAILY', 'REPEATING', 'ONCE', 'AS_NEEDED'))
  )
);
