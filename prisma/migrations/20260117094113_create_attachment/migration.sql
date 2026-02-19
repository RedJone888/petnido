/*
  Warnings:

  - You are about to drop the column `budgetMax` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `budgetMin` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `isPaid` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `lon` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `petCount` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `petType` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `Need` table. All the data in the column will be lost.
  - You are about to drop the `ServicePhoto` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `addressLat` to the `Need` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressLon` to the `Need` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requirement` to the `Need` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Need` table without a default value. This is not possible if the table is not empty.
  - Made the column `addressRaw` on table `Need` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "NeedCategory" AS ENUM ('VISIT', 'FOSTER', 'OTHER');

-- DropForeignKey
ALTER TABLE "ServicePhoto" DROP CONSTRAINT "ServicePhoto_serviceId_fkey";

-- AlterTable
ALTER TABLE "Need" DROP COLUMN "budgetMax",
DROP COLUMN "budgetMin",
DROP COLUMN "description",
DROP COLUMN "isPaid",
DROP COLUMN "lat",
DROP COLUMN "lon",
DROP COLUMN "petCount",
DROP COLUMN "petType",
DROP COLUMN "photos",
ADD COLUMN     "addressLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "addressLon" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "category" "NeedCategory" NOT NULL DEFAULT 'VISIT',
ADD COLUMN     "fosterRange" TEXT,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priceAmount" INTEGER,
ADD COLUMN     "requirement" TEXT NOT NULL,
ADD COLUMN     "totalPrice" INTEGER NOT NULL,
ALTER COLUMN "addressRaw" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pet" ALTER COLUMN "name" DROP NOT NULL;

-- DropTable
DROP TABLE "ServicePhoto";

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "originalSignature" TEXT NOT NULL,
    "serviceKind" "ServicePhotoKind",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceId" TEXT,
    "needId" TEXT,
    "petId" TEXT,
    "needPetId" TEXT,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedPet" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "petType" "PetType" NOT NULL,
    "customType" TEXT,
    "count" INTEGER NOT NULL,
    "description" TEXT,
    "petIds" TEXT[],

    CONSTRAINT "NeedPet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_needPetId_fkey" FOREIGN KEY ("needPetId") REFERENCES "NeedPet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedPet" ADD CONSTRAINT "NeedPet_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
