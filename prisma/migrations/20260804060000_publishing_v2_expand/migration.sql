-- CreateEnum
CREATE TYPE "PublishKindV2" AS ENUM ('NEED', 'SERVICE');

-- CreateEnum
CREATE TYPE "PublishDraftStatusV2" AS ENUM ('ACTIVE', 'PUBLISHED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PublishModeV2" AS ENUM ('HOME_VISIT', 'BOARDING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NeedStateV2" AS ENUM ('DRAFT', 'OPEN', 'MATCHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceStateV2" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MoneyKindV2" AS ENUM ('EXACT', 'RANGE', 'OPEN');

-- CreateEnum
CREATE TYPE "AdditionalCostKindV2" AS ENUM ('TRAVEL', 'SUPPLY');

-- CreateEnum
CREATE TYPE "CostModeV2" AS ENUM ('NONE', 'FIXED', 'ACTUAL', 'DISCUSS');

-- CreateEnum
CREATE TYPE "TaskPriorityV2" AS ENUM ('MUST', 'NICE');

-- CreateEnum
CREATE TYPE "TaskScheduleKindV2" AS ENUM ('EACH_VISIT', 'DAILY', 'REPEATING', 'ONCE', 'AS_NEEDED');

-- CreateEnum
CREATE TYPE "VisitWindowKindV2" AS ENUM ('FLEXIBLE', 'PREFERRED');

-- CreateEnum
CREATE TYPE "SupplyProviderV2" AS ENUM ('OWNER', 'PROVIDER', 'NOT_NEEDED');

-- CreateEnum
CREATE TYPE "NeedRequirementKindV2" AS ENUM ('ENVIRONMENT_REQUIRED', 'UNACCEPTABLE', 'OTHER_NEED', 'WARNING');

-- CreateEnum
CREATE TYPE "TransportModeV2" AS ENUM ('OWNER', 'PROVIDER', 'TAXI', 'DISCUSS');

-- CreateEnum
CREATE TYPE "HandoffDirectionV2" AS ENUM ('OWNER_DROPOFF', 'PROVIDER_PICKUP', 'SPLIT', 'DISCUSS');

-- CreateEnum
CREATE TYPE "AvailabilityRuleKindV2" AS ENUM ('WEEKLY', 'DATE_RANGE');

-- CreateEnum
CREATE TYPE "PetSizeV2" AS ENUM ('TINY', 'SMALL', 'MEDIUM', 'LARGE', 'GIANT', 'ANY');

-- CreateEnum
CREATE TYPE "PetAgeBandV2" AS ENUM ('YOUNG', 'ADULT', 'SENIOR', 'ANY');

-- CreateEnum
CREATE TYPE "PriceUnitV2" AS ENUM ('HOUR', 'VISIT', 'DAY', 'FIXED');

-- CreateEnum
CREATE TYPE "DiscountKindV2" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "V2AttachmentPurpose" AS ENUM ('GENERAL', 'EXPERIENCE', 'ENVIRONMENT', 'PET');

-- CreateTable
CREATE TABLE "PublishDraftV2" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" "PublishKindV2" NOT NULL,
    "mode" "PublishModeV2",
    "schemaVersion" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" "PublishDraftStatusV2" NOT NULL DEFAULT 'ACTIVE',
    "publishedNeedId" TEXT,
    "publishedServiceId" TEXT,
    "lastValidatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishDraftV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSnapshotV2" (
    "id" TEXT NOT NULL,
    "sourceLocationId" TEXT,
    "lat" DECIMAL(9,6) NOT NULL,
    "lon" DECIMAL(9,6) NOT NULL,
    "regionLabel" TEXT,
    "displayPrecision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationSnapshotV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedV2" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "mode" "PublishModeV2" NOT NULL,
    "state" "NeedStateV2" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL,
    "locationSnapshotId" TEXT NOT NULL,
    "budgetKind" "MoneyKindV2" NOT NULL,
    "minAmountMinor" BIGINT,
    "maxAmountMinor" BIGINT,
    "currency" "Currency" NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NeedV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisitNeedDetailV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL,
    "firstServiceDate" DATE NOT NULL,
    "visitsPerServiceDay" INTEGER NOT NULL,

    CONSTRAINT "HomeVisitNeedDetailV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardingNeedDetailV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "transportMode" "TransportModeV2" NOT NULL,
    "handoffDirection" "HandoffDirectionV2" NOT NULL,
    "maxProviderDistanceMeters" INTEGER,

    CONSTRAINT "BoardingNeedDetailV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedDateExceptionV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "NeedDateExceptionV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedVisitWindowV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "visitNumber" INTEGER NOT NULL,
    "kind" "VisitWindowKindV2" NOT NULL,
    "preferredLocalTime" TEXT,

    CONSTRAINT "NeedVisitWindowV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedPetSnapshotV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "clientPetKey" TEXT NOT NULL,
    "sourcePetId" TEXT,
    "name" TEXT NOT NULL,
    "petType" TEXT NOT NULL,
    "breed" TEXT,
    "birthDate" DATE,
    "weightGrams" INTEGER,
    "sex" TEXT NOT NULL,
    "neutered" TEXT NOT NULL,
    "careNotes" TEXT,

    CONSTRAINT "NeedPetSnapshotV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedTaskV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "clientTaskKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "instructions" TEXT,
    "priority" "TaskPriorityV2" NOT NULL,
    "scheduleKind" "TaskScheduleKindV2" NOT NULL,
    "visitNumbers" INTEGER[],
    "localTimes" TEXT[],
    "intervalDays" INTEGER,
    "dueDate" DATE,
    "trigger" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "NeedTaskV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedTaskPetV2" (
    "taskId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,

    CONSTRAINT "NeedTaskPetV2_pkey" PRIMARY KEY ("taskId","petId")
);

-- CreateTable
CREATE TABLE "NeedSupplyV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "clientSupplyKey" TEXT NOT NULL,
    "petId" TEXT,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "providedBy" "SupplyProviderV2" NOT NULL,

    CONSTRAINT "NeedSupplyV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedRequirementV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "petId" TEXT,
    "kind" "NeedRequirementKindV2" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "NeedRequirementV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedAdditionalCostV2" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "kind" "AdditionalCostKindV2" NOT NULL,
    "mode" "CostModeV2" NOT NULL,
    "amountMinor" BIGINT,

    CONSTRAINT "NeedAdditionalCostV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeedV2Attachment" (
    "needId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "purpose" "V2AttachmentPurpose" NOT NULL DEFAULT 'GENERAL',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NeedV2Attachment_pkey" PRIMARY KEY ("needId","attachmentId")
);

-- CreateTable
CREATE TABLE "ServiceV2" (
    "id" TEXT NOT NULL,
    "serviceProfileId" TEXT NOT NULL,
    "mode" "PublishModeV2" NOT NULL,
    "state" "ServiceStateV2" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeZone" TEXT NOT NULL,
    "locationSnapshotId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "serviceRadiusMeters" INTEGER,
    "maxPetCapacity" INTEGER,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardingServiceDetailV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "environmentDescription" TEXT NOT NULL,
    "residentPetNotes" TEXT,
    "suppliedItems" TEXT[],

    CONSTRAINT "BoardingServiceDetailV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAvailabilityRuleV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "kind" "AvailabilityRuleKindV2" NOT NULL,
    "weekdays" INTEGER[],
    "startsOn" DATE,
    "endsOn" DATE,
    "includesHolidays" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ServiceAvailabilityRuleV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAvailabilityExceptionV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "available" BOOLEAN NOT NULL,
    "note" TEXT,

    CONSTRAINT "ServiceAvailabilityExceptionV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePetPolicyV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "petType" TEXT NOT NULL,
    "size" "PetSizeV2" NOT NULL,
    "ageBand" "PetAgeBandV2" NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ServicePetPolicyV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOfferingV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ServiceOfferingV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePriceRuleV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" "PriceUnitV2" NOT NULL,
    "amountMinor" BIGINT NOT NULL,

    CONSTRAINT "ServicePriceRuleV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDiscountRuleV2" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "DiscountKindV2" NOT NULL,
    "value" INTEGER NOT NULL,
    "condition" TEXT,

    CONSTRAINT "ServiceDiscountRuleV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceV2Attachment" (
    "serviceId" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "purpose" "V2AttachmentPurpose" NOT NULL DEFAULT 'GENERAL',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceV2Attachment_pkey" PRIMARY KEY ("serviceId","attachmentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublishDraftV2_publishedNeedId_key" ON "PublishDraftV2"("publishedNeedId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishDraftV2_publishedServiceId_key" ON "PublishDraftV2"("publishedServiceId");

-- CreateIndex
CREATE INDEX "PublishDraftV2_ownerId_status_updatedAt_idx" ON "PublishDraftV2"("ownerId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "PublishDraftV2_kind_mode_status_idx" ON "PublishDraftV2"("kind", "mode", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NeedV2_locationSnapshotId_key" ON "NeedV2"("locationSnapshotId");

-- CreateIndex
CREATE INDEX "NeedV2_state_endsAt_createdAt_idx" ON "NeedV2"("state", "endsAt", "createdAt");

-- CreateIndex
CREATE INDEX "NeedV2_mode_state_endsAt_idx" ON "NeedV2"("mode", "state", "endsAt");

-- CreateIndex
CREATE INDEX "NeedV2_ownerId_createdAt_idx" ON "NeedV2"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HomeVisitNeedDetailV2_needId_key" ON "HomeVisitNeedDetailV2"("needId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardingNeedDetailV2_needId_key" ON "BoardingNeedDetailV2"("needId");

-- CreateIndex
CREATE UNIQUE INDEX "NeedDateExceptionV2_needId_date_key" ON "NeedDateExceptionV2"("needId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "NeedVisitWindowV2_needId_visitNumber_key" ON "NeedVisitWindowV2"("needId", "visitNumber");

-- CreateIndex
CREATE INDEX "NeedPetSnapshotV2_sourcePetId_idx" ON "NeedPetSnapshotV2"("sourcePetId");

-- CreateIndex
CREATE INDEX "NeedPetSnapshotV2_petType_needId_idx" ON "NeedPetSnapshotV2"("petType", "needId");

-- CreateIndex
CREATE UNIQUE INDEX "NeedPetSnapshotV2_needId_clientPetKey_key" ON "NeedPetSnapshotV2"("needId", "clientPetKey");

-- CreateIndex
CREATE INDEX "NeedTaskV2_category_needId_idx" ON "NeedTaskV2"("category", "needId");

-- CreateIndex
CREATE UNIQUE INDEX "NeedTaskV2_needId_clientTaskKey_key" ON "NeedTaskV2"("needId", "clientTaskKey");

-- CreateIndex
CREATE INDEX "NeedTaskPetV2_petId_idx" ON "NeedTaskPetV2"("petId");

-- CreateIndex
CREATE INDEX "NeedSupplyV2_petId_idx" ON "NeedSupplyV2"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "NeedSupplyV2_needId_clientSupplyKey_key" ON "NeedSupplyV2"("needId", "clientSupplyKey");

-- CreateIndex
CREATE INDEX "NeedRequirementV2_needId_kind_idx" ON "NeedRequirementV2"("needId", "kind");

-- CreateIndex
CREATE INDEX "NeedRequirementV2_petId_idx" ON "NeedRequirementV2"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "NeedAdditionalCostV2_needId_kind_key" ON "NeedAdditionalCostV2"("needId", "kind");

-- CreateIndex
CREATE INDEX "NeedV2Attachment_attachmentId_idx" ON "NeedV2Attachment"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceV2_locationSnapshotId_key" ON "ServiceV2"("locationSnapshotId");

-- CreateIndex
CREATE INDEX "ServiceV2_state_mode_createdAt_idx" ON "ServiceV2"("state", "mode", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceV2_serviceProfileId_state_idx" ON "ServiceV2"("serviceProfileId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "BoardingServiceDetailV2_serviceId_key" ON "BoardingServiceDetailV2"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceAvailabilityRuleV2_serviceId_kind_idx" ON "ServiceAvailabilityRuleV2"("serviceId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAvailabilityExceptionV2_serviceId_date_key" ON "ServiceAvailabilityExceptionV2"("serviceId", "date");

-- CreateIndex
CREATE INDEX "ServicePetPolicyV2_petType_accepted_serviceId_idx" ON "ServicePetPolicyV2"("petType", "accepted", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePetPolicyV2_serviceId_petType_size_ageBand_key" ON "ServicePetPolicyV2"("serviceId", "petType", "size", "ageBand");

-- CreateIndex
CREATE INDEX "ServiceOfferingV2_category_serviceId_idx" ON "ServiceOfferingV2"("category", "serviceId");

-- CreateIndex
CREATE INDEX "ServiceV2Attachment_attachmentId_idx" ON "ServiceV2Attachment"("attachmentId");

-- AddForeignKey
ALTER TABLE "PublishDraftV2" ADD CONSTRAINT "PublishDraftV2_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishDraftV2" ADD CONSTRAINT "PublishDraftV2_publishedNeedId_fkey" FOREIGN KEY ("publishedNeedId") REFERENCES "NeedV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishDraftV2" ADD CONSTRAINT "PublishDraftV2_publishedServiceId_fkey" FOREIGN KEY ("publishedServiceId") REFERENCES "ServiceV2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedV2" ADD CONSTRAINT "NeedV2_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedV2" ADD CONSTRAINT "NeedV2_locationSnapshotId_fkey" FOREIGN KEY ("locationSnapshotId") REFERENCES "LocationSnapshotV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisitNeedDetailV2" ADD CONSTRAINT "HomeVisitNeedDetailV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingNeedDetailV2" ADD CONSTRAINT "BoardingNeedDetailV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedDateExceptionV2" ADD CONSTRAINT "NeedDateExceptionV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedVisitWindowV2" ADD CONSTRAINT "NeedVisitWindowV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedPetSnapshotV2" ADD CONSTRAINT "NeedPetSnapshotV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedPetSnapshotV2" ADD CONSTRAINT "NeedPetSnapshotV2_sourcePetId_fkey" FOREIGN KEY ("sourcePetId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedTaskV2" ADD CONSTRAINT "NeedTaskV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedTaskPetV2" ADD CONSTRAINT "NeedTaskPetV2_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "NeedTaskV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedTaskPetV2" ADD CONSTRAINT "NeedTaskPetV2_petId_fkey" FOREIGN KEY ("petId") REFERENCES "NeedPetSnapshotV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedSupplyV2" ADD CONSTRAINT "NeedSupplyV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedSupplyV2" ADD CONSTRAINT "NeedSupplyV2_petId_fkey" FOREIGN KEY ("petId") REFERENCES "NeedPetSnapshotV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedRequirementV2" ADD CONSTRAINT "NeedRequirementV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedRequirementV2" ADD CONSTRAINT "NeedRequirementV2_petId_fkey" FOREIGN KEY ("petId") REFERENCES "NeedPetSnapshotV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedAdditionalCostV2" ADD CONSTRAINT "NeedAdditionalCostV2_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedV2Attachment" ADD CONSTRAINT "NeedV2Attachment_needId_fkey" FOREIGN KEY ("needId") REFERENCES "NeedV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeedV2Attachment" ADD CONSTRAINT "NeedV2Attachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceV2" ADD CONSTRAINT "ServiceV2_serviceProfileId_fkey" FOREIGN KEY ("serviceProfileId") REFERENCES "ServiceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceV2" ADD CONSTRAINT "ServiceV2_locationSnapshotId_fkey" FOREIGN KEY ("locationSnapshotId") REFERENCES "LocationSnapshotV2"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingServiceDetailV2" ADD CONSTRAINT "BoardingServiceDetailV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAvailabilityRuleV2" ADD CONSTRAINT "ServiceAvailabilityRuleV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAvailabilityExceptionV2" ADD CONSTRAINT "ServiceAvailabilityExceptionV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePetPolicyV2" ADD CONSTRAINT "ServicePetPolicyV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOfferingV2" ADD CONSTRAINT "ServiceOfferingV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePriceRuleV2" ADD CONSTRAINT "ServicePriceRuleV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDiscountRuleV2" ADD CONSTRAINT "ServiceDiscountRuleV2_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceV2Attachment" ADD CONSTRAINT "ServiceV2Attachment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceV2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceV2Attachment" ADD CONSTRAINT "ServiceV2Attachment_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain checks for the V2 publishing aggregates. This migration is expand-only.
ALTER TABLE "PublishDraftV2" ADD CONSTRAINT "PublishDraftV2_revision_check"
CHECK ("schemaVersion" >= 1 AND "revision" >= 0);
ALTER TABLE "PublishDraftV2" ADD CONSTRAINT "PublishDraftV2_published_target_check"
CHECK (
  ("publishedNeedId" IS NULL OR "kind" = 'NEED') AND
  ("publishedServiceId" IS NULL OR "kind" = 'SERVICE') AND
  NOT ("publishedNeedId" IS NOT NULL AND "publishedServiceId" IS NOT NULL)
);

ALTER TABLE "LocationSnapshotV2" ADD CONSTRAINT "LocationSnapshotV2_coordinate_check"
CHECK ("lat" BETWEEN -90 AND 90 AND "lon" BETWEEN -180 AND 180);

ALTER TABLE "NeedV2" ADD CONSTRAINT "NeedV2_date_range_check"
CHECK ("startsAt" < "endsAt");
ALTER TABLE "NeedV2" ADD CONSTRAINT "NeedV2_money_check"
CHECK (
  ("minAmountMinor" IS NULL OR "minAmountMinor" >= 0) AND
  ("maxAmountMinor" IS NULL OR "maxAmountMinor" >= 0) AND
  (
    ("budgetKind" = 'EXACT' AND "minAmountMinor" IS NOT NULL AND "maxAmountMinor" IS NULL) OR
    ("budgetKind" = 'RANGE' AND "minAmountMinor" IS NOT NULL AND "maxAmountMinor" IS NOT NULL AND "minAmountMinor" <= "maxAmountMinor") OR
    ("budgetKind" = 'OPEN' AND "minAmountMinor" IS NULL AND "maxAmountMinor" IS NULL)
  )
);

ALTER TABLE "HomeVisitNeedDetailV2" ADD CONSTRAINT "HomeVisitNeedDetailV2_positive_check"
CHECK ("intervalDays" > 0 AND "visitsPerServiceDay" BETWEEN 1 AND 12);
ALTER TABLE "BoardingNeedDetailV2" ADD CONSTRAINT "BoardingNeedDetailV2_distance_check"
CHECK ("maxProviderDistanceMeters" IS NULL OR "maxProviderDistanceMeters" > 0);
ALTER TABLE "NeedVisitWindowV2" ADD CONSTRAINT "NeedVisitWindowV2_value_check"
CHECK (
  "visitNumber" > 0 AND
  (("kind" = 'FLEXIBLE' AND "preferredLocalTime" IS NULL) OR
   ("kind" = 'PREFERRED' AND "preferredLocalTime" IS NOT NULL))
);
ALTER TABLE "NeedPetSnapshotV2" ADD CONSTRAINT "NeedPetSnapshotV2_weight_check"
CHECK ("weightGrams" IS NULL OR "weightGrams" > 0);
ALTER TABLE "NeedTaskV2" ADD CONSTRAINT "NeedTaskV2_schedule_check"
CHECK (
  "order" >= 0 AND
  (
    ("scheduleKind" = 'EACH_VISIT' AND cardinality("visitNumbers") > 0 AND "intervalDays" IS NULL AND "dueDate" IS NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'DAILY' AND "intervalDays" IS NULL AND "dueDate" IS NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'REPEATING' AND "intervalDays" > 0 AND "dueDate" IS NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'ONCE' AND "intervalDays" IS NULL AND "dueDate" IS NOT NULL AND "trigger" IS NULL) OR
    ("scheduleKind" = 'AS_NEEDED' AND "intervalDays" IS NULL AND "dueDate" IS NULL AND "trigger" IS NOT NULL)
  )
);
ALTER TABLE "NeedAdditionalCostV2" ADD CONSTRAINT "NeedAdditionalCostV2_amount_check"
CHECK (
  ("mode" = 'FIXED' AND "amountMinor" IS NOT NULL AND "amountMinor" >= 0) OR
  ("mode" <> 'FIXED' AND "amountMinor" IS NULL)
);

ALTER TABLE "ServiceV2" ADD CONSTRAINT "ServiceV2_mode_capacity_radius_check"
CHECK (
  (("mode" = 'BOARDING' AND "maxPetCapacity" BETWEEN 1 AND 100) OR
   ("mode" <> 'BOARDING' AND "maxPetCapacity" IS NULL)) AND
  (("mode" = 'HOME_VISIT' AND "serviceRadiusMeters" > 0) OR
   ("mode" = 'BOARDING' AND "serviceRadiusMeters" IS NULL) OR
   ("mode" = 'CUSTOM' AND ("serviceRadiusMeters" IS NULL OR "serviceRadiusMeters" > 0)))
);
ALTER TABLE "ServiceAvailabilityRuleV2" ADD CONSTRAINT "ServiceAvailabilityRuleV2_value_check"
CHECK (
  ("kind" = 'WEEKLY' AND cardinality("weekdays") > 0 AND "startsOn" IS NULL AND "endsOn" IS NULL) OR
  ("kind" = 'DATE_RANGE' AND "startsOn" IS NOT NULL AND "endsOn" IS NOT NULL AND "startsOn" <= "endsOn")
);
ALTER TABLE "ServicePriceRuleV2" ADD CONSTRAINT "ServicePriceRuleV2_amount_check"
CHECK ("amountMinor" >= 0);
ALTER TABLE "ServiceDiscountRuleV2" ADD CONSTRAINT "ServiceDiscountRuleV2_value_check"
CHECK ("value" > 0 AND ("kind" <> 'PERCENT' OR "value" <= 100));
