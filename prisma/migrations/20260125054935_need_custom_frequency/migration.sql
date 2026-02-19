/*
  Warnings:

  - You are about to drop the column `customFrequency` on the `Need` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Need" DROP COLUMN "customFrequency",
ADD COLUMN     "customDays" INTEGER,
ADD COLUMN     "customTimes" INTEGER;
