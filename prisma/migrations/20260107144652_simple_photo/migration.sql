/*
  Warnings:

  - You are about to drop the column `experienceServiceId` on the `ServicePhoto` table. All the data in the column will be lost.
  - You are about to drop the column `homeServiceId` on the `ServicePhoto` table. All the data in the column will be lost.
  - Added the required column `serviceId` to the `ServicePhoto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServicePhoto" DROP CONSTRAINT "ServicePhoto_experienceServiceId_fkey";

-- DropForeignKey
ALTER TABLE "ServicePhoto" DROP CONSTRAINT "ServicePhoto_homeServiceId_fkey";

-- AlterTable
ALTER TABLE "ServicePhoto" DROP COLUMN "experienceServiceId",
DROP COLUMN "homeServiceId",
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ServicePhoto" ADD CONSTRAINT "ServicePhoto_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
