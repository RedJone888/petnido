/*
  Warnings:

  - You are about to drop the column `yearsExperience` on the `ServiceProfile` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Currency" ADD VALUE 'TWD';
ALTER TYPE "Currency" ADD VALUE 'KRW';
ALTER TYPE "Currency" ADD VALUE 'GBP';

-- AlterTable
ALTER TABLE "ServiceProfile" DROP COLUMN "yearsExperience",
ADD COLUMN     "monthsExperience" INTEGER;
