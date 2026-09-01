-- AlterTable: existing profiles must remain returning users.
ALTER TABLE "Profile"
ADD COLUMN "onboardingStep" TEXT NOT NULL DEFAULT 'PROFILE',
ADD COLUMN "initialIntent" TEXT,
ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'ja',
ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'Asia/Tokyo';

UPDATE "Profile" SET "onboardingStep" = 'COMPLETE';

-- AlterTable
ALTER TABLE "Pet"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "lat" DECIMAL(9,6) NOT NULL,
    "lon" DECIMAL(9,6) NOT NULL,
    "regionLabel" TEXT,
    "displayPrecision" TEXT NOT NULL DEFAULT 'MAP_POINT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailInstant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ServiceProfile" ADD COLUMN "defaultLocationId" TEXT;

-- CreateIndex
CREATE INDEX "UserLocation_userId_isDefault_idx" ON "UserLocation"("userId", "isDefault");
CREATE INDEX "UserLocation_userId_archivedAt_idx" ON "UserLocation"("userId", "archivedAt");
CREATE UNIQUE INDEX "UserLocation_one_active_default_per_user"
ON "UserLocation"("userId") WHERE "isDefault" = true AND "archivedAt" IS NULL;
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceProfile" ADD CONSTRAINT "ServiceProfile_defaultLocationId_fkey"
FOREIGN KEY ("defaultLocationId") REFERENCES "UserLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
