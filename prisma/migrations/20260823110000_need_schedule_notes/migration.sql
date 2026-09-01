-- Preserve timing/date notes separately from the general need description.
ALTER TABLE "NeedV2"
ADD COLUMN "scheduleNotes" TEXT;
