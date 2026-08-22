-- Allow AS_NEEDED tasks without a dedicated trigger value.
-- Explanatory details live in the task notes/instructions, so the trigger
-- column is optional and no longer required for as-needed care.
ALTER TABLE "NeedTaskV2" DROP CONSTRAINT "NeedTaskV2_schedule_check";

ALTER TABLE "NeedTaskV2" ADD CONSTRAINT "NeedTaskV2_schedule_check"
CHECK (
  "order" >= 0 AND
  (
    ("scheduleKind" = 'EACH_VISIT' AND cardinality("visitNumbers") > 0 AND "intervalDays" IS NULL AND "dueDate" IS NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'DAILY' AND "intervalDays" IS NULL AND "dueDate" IS NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'REPEATING' AND "intervalDays" > 0 AND "dueDate" IS NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'ONCE' AND "intervalDays" IS NULL AND "dueDate" IS NOT NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'AS_NEEDED' AND "intervalDays" IS NULL AND "dueDate" IS NULL)
  )
);
