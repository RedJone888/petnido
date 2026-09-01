-- Optional origin keys let dry-run/backfill reconciliation pair legacy and V2
-- aggregates without adding destructive foreign-key coupling to legacy tables.
ALTER TABLE "NeedV2" ADD COLUMN "legacyNeedId" TEXT;
ALTER TABLE "ServiceV2" ADD COLUMN "legacyServiceId" TEXT;

CREATE UNIQUE INDEX "NeedV2_legacyNeedId_key" ON "NeedV2"("legacyNeedId");
CREATE UNIQUE INDEX "ServiceV2_legacyServiceId_key" ON "ServiceV2"("legacyServiceId");
