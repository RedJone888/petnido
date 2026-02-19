-- AlterTable
ALTER TABLE "ServicePricing" ALTER COLUMN "petTypes" SET DEFAULT ARRAY[]::"PetType"[],
ALTER COLUMN "price" SET DEFAULT 0,
ALTER COLUMN "unit" SET DEFAULT 'DAY';

-- AlterTable
ALTER TABLE "ServiceProfile" ALTER COLUMN "petTypes" SET DEFAULT ARRAY[]::TEXT[];
