ALTER TABLE "PublishDraftV2"
  ADD COLUMN "editingBaselineJson" TEXT,
  ADD COLUMN "isDirty" BOOLEAN NOT NULL DEFAULT false;
