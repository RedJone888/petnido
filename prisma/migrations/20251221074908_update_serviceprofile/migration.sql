/*
  Warnings:

  - You are about to drop the column `serviceId` on the `ServicePhoto` table. All the data in the column will be lost.
  - You are about to drop the column `environmentPhotos` on the `ServiceProfile` table. All the data in the column will be lost.
  - You are about to drop the column `petTypes` on the `ServiceProfile` table. All the data in the column will be lost.
  - You are about to drop the column `serviceAreaRaw` on the `ServiceProfile` table. All the data in the column will be lost.
  - You are about to drop the column `serviceLat` on the `ServiceProfile` table. All the data in the column will be lost.
  - You are about to drop the column `serviceLon` on the `ServiceProfile` table. All the data in the column will be lost.
  - You are about to drop the `ServicePricing` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `areaLat` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `areaLon` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `areaRaw` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceUnit` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experienceServiceId` to the `ServicePhoto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `homeServiceId` to the `ServicePhoto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('JPY', 'USD', 'EUR', 'CNY');

-- DropForeignKey
ALTER TABLE "ServicePhoto" DROP CONSTRAINT "ServicePhoto_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "ServicePricing" DROP CONSTRAINT "ServicePricing_serviceId_fkey";

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "areaLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "areaLon" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "areaRaw" TEXT NOT NULL,
ADD COLUMN     "currency" "Currency" NOT NULL,
ADD COLUMN     "petTypes" "PetType"[],
ADD COLUMN     "priceUnit" "PriceUnit" NOT NULL;

-- AlterTable
ALTER TABLE "ServicePhoto" DROP COLUMN "serviceId",
ADD COLUMN     "experienceServiceId" TEXT NOT NULL,
ADD COLUMN     "homeServiceId" TEXT NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ServiceProfile" DROP COLUMN "environmentPhotos",
DROP COLUMN "petTypes",
DROP COLUMN "serviceAreaRaw",
DROP COLUMN "serviceLat",
DROP COLUMN "serviceLon",
ADD COLUMN     "baseAreaRaw" TEXT,
ADD COLUMN     "baseCurrency" "Currency",
ADD COLUMN     "baseLat" DOUBLE PRECISION,
ADD COLUMN     "baseLon" DOUBLE PRECISION;

-- DropTable
DROP TABLE "ServicePricing";

-- CreateTable
CREATE TABLE "PriceRule" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceRule" ADD CONSTRAINT "PriceRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePhoto" ADD CONSTRAINT "ServicePhoto_experienceServiceId_fkey" FOREIGN KEY ("experienceServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePhoto" ADD CONSTRAINT "ServicePhoto_homeServiceId_fkey" FOREIGN KEY ("homeServiceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
