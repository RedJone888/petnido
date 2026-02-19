/*
  Warnings:

  - You are about to drop the column `frequency` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Need` table. All the data in the column will be lost.
  - The `fosterRange` column on the `Need` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('ONCE_A_DAY', 'TWICE_A_DAY', 'EVERY_2_DAYS', 'EVERY_3_DAYS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DistanceRange" AS ENUM ('WITHIN_3KM', 'WITHIN_5KM', 'WITHIN_10KM', 'NO_LIMIT');

-- CreateEnum
CREATE TYPE "TransportMethod" AS ENUM ('SELF', 'SITTER', 'TAXI', 'DISCUSS');

-- AlterTable
ALTER TABLE "Need" DROP COLUMN "frequency",
DROP COLUMN "notes",
ADD COLUMN     "customFrequency" TEXT,
ADD COLUMN     "frequencyType" "FrequencyType",
ADD COLUMN     "transportMethod" "TransportMethod",
DROP COLUMN "fosterRange",
ADD COLUMN     "fosterRange" "DistanceRange";
