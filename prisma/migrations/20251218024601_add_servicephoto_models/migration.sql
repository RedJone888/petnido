/*
  Warnings:

  - The values [OVERNIGHT,DAYCARE,DROP_IN,DOG_WALK] on the enum `ServiceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `availabilityNote` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `availableFrom` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `availableTo` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `Service` table. All the data in the column will be lost.
  - Added the required column `availabilityPreset` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Made the column `serviceType` on table `Service` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AvailabilityPreset" AS ENUM ('LONG_TERM_OK', 'EVERYDAY', 'WEEKENDS_ONLY', 'WEEKDAYS_ONLY', 'HOLIDAYS_ONLY', 'DATE_RANGE');

-- CreateEnum
CREATE TYPE "ServicePhotoKind" AS ENUM ('EXPERIENCE', 'HOME');

-- AlterEnum
ALTER TYPE "PetType" ADD VALUE 'GUINEA_PIG';

-- AlterEnum
BEGIN;
CREATE TYPE "ServiceType_new" AS ENUM ('HOME_VISIT', 'BOARDING', 'OTHER');
ALTER TABLE "Service" ALTER COLUMN "serviceType" TYPE "ServiceType_new" USING ("serviceType"::text::"ServiceType_new");
ALTER TYPE "ServiceType" RENAME TO "ServiceType_old";
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";
DROP TYPE "ServiceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "availabilityNote",
DROP COLUMN "availableFrom",
DROP COLUMN "availableTo",
DROP COLUMN "photos",
ADD COLUMN     "availabilityPreset" "AvailabilityPreset" NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateFrom" TIMESTAMP(3),
ADD COLUMN     "dateTo" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "serviceType" SET NOT NULL;

-- AlterTable
ALTER TABLE "ServicePricing" ALTER COLUMN "petTypes" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ServicePhoto" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "kind" "ServicePhotoKind" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServicePhoto" ADD CONSTRAINT "ServicePhoto_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
