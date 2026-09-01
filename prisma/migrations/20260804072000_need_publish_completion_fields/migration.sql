-- Additive fields required to make V2 need publication idempotent and to save
-- new pet details back to the owner's private pet profile after publication.
ALTER TABLE "NeedV2"
ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "NeedV2_idempotencyKey_key"
ON "NeedV2"("idempotencyKey");

ALTER TABLE "Pet"
ADD COLUMN "customType" TEXT,
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "birthDate" DATE,
ADD COLUMN "weightGrams" INTEGER,
ADD COLUMN "sex" TEXT,
ADD COLUMN "neutered" TEXT;

ALTER TABLE "Pet"
ADD CONSTRAINT "Pet_quantity_check"
CHECK ("quantity" > 0 AND "quantity" <= 100),
ADD CONSTRAINT "Pet_weight_check"
CHECK ("weightGrams" IS NULL OR "weightGrams" > 0);

-- The initial nullable add supports existing/development V2 rows. Production
-- cutover remains blocked until the dry-run confirms there are no V2 needs.
ALTER TABLE "NeedV2"
ALTER COLUMN "idempotencyKey" SET NOT NULL;
