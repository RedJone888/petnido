/*
  Warnings:

  - The `petType` column on the `NeedPet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `petCategory` to the `NeedPet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NeedPet" ADD COLUMN     "petCategory" "PetType" NOT NULL,
DROP COLUMN "petType",
ADD COLUMN     "petType" TEXT;
