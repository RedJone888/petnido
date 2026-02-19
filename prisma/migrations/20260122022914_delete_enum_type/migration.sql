/*
  Warnings:

  - Changed the type of `category` on the `Need` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `serviceType` on the `Service` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('VISIT', 'FOSTER', 'OTHER');

-- AlterTable
ALTER TABLE "Need" DROP COLUMN "category",
ADD COLUMN     "category" "ServiceCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "serviceType" TYPE TEXT;
UPDATE "Service" SET "serviceType" = 'VISIT' WHERE "serviceType" = 'HOME_VISIT';
ALTER TABLE "Service" ALTER COLUMN "serviceType" TYPE "ServiceCategory" USING ("serviceType"::"ServiceCategory");

-- DropEnum
DROP TYPE "NeedCategory";

-- DropEnum
DROP TYPE "ServiceType";
