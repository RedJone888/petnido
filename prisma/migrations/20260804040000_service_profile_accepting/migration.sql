-- Expand-only: keep existing provider profiles available until their owners opt out.
ALTER TABLE "ServiceProfile"
ADD COLUMN "isAccepting" BOOLEAN NOT NULL DEFAULT true;
