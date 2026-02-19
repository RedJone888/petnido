/*
  Warnings:

  - You are about to drop the column `originalSignature` on the `Attachment` table. All the data in the column will be lost.
  - Added the required column `signature` to the `Attachment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "originalSignature",
ADD COLUMN     "signature" TEXT NOT NULL;
