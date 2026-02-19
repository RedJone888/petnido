/*
  Warnings:

  - Added the required column `currency` to the `Need` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Need" ADD COLUMN     "currency" "Currency" NOT NULL;
