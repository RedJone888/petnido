-- The boarding task editor no longer collects per-frequency schedule details.
-- Explanations live in the task notes, so the dedicated schedule columns are
-- obsolete. visitNumbers stays because home-visit tasks still assign tasks to
-- specific visits of the day.
ALTER TABLE "NeedTaskV2" DROP CONSTRAINT "NeedTaskV2_schedule_check";

ALTER TABLE "NeedTaskV2" DROP COLUMN "localTimes";
ALTER TABLE "NeedTaskV2" DROP COLUMN "intervalDays";
ALTER TABLE "NeedTaskV2" DROP COLUMN "dueDate";
ALTER TABLE "NeedTaskV2" DROP COLUMN "trigger";

ALTER TABLE "NeedTaskV2" ADD CONSTRAINT "NeedTaskV2_schedule_check"
CHECK (
  "order" >= 0 AND
  (
    ("scheduleKind" = 'EACH_VISIT' AND cardinality("visitNumbers") > 0) OR
    ("scheduleKind" IN ('DAILY', 'REPEATING', 'ONCE', 'AS_NEEDED'))
  )
);
