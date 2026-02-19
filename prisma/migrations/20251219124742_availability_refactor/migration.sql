/*
  Warnings:

  - You are about to drop the column `availabilityPreset` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `dateFrom` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `dateTo` on the `Service` table. All the data in the column will be lost.
  - Added the required column `availabilityRangeType` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `availabilityWeekPattern` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AvailabilityRangeType" AS ENUM ('LONG_TERM', 'DATE_RANGE');

-- CreateEnum
CREATE TYPE "AvailabilityWeekPattern" AS ENUM ('EVERYDAY', 'WEEKDAYS_ONLY', 'WEEKENDS_ONLY');

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "availabilityPreset",
DROP COLUMN "dateFrom",
DROP COLUMN "dateTo",
ADD COLUMN     "availabilityRangeType" "AvailabilityRangeType" NOT NULL,
ADD COLUMN     "availabilityWeekPattern" "AvailabilityWeekPattern" NOT NULL,
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "availableTo" TIMESTAMP(3),
ADD COLUMN     "includeHolidays" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "AvailabilityPreset";
