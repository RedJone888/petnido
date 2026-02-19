/*
  Warnings:

  - You are about to drop the column `customType` on the `NeedPet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NeedPet" DROP COLUMN "customType",
ADD COLUMN     "tags" TEXT[];
