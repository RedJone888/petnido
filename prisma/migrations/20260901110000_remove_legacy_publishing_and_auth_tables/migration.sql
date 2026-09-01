DROP TABLE IF EXISTS "Application" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "PriceRule" CASCADE;
DROP TABLE IF EXISTS "NeedPet" CASCADE;
DROP TABLE IF EXISTS "Need" CASCADE;
DROP TABLE IF EXISTS "Service" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;

ALTER TABLE "Attachment"
  DROP COLUMN IF EXISTS "serviceKind",
  DROP COLUMN IF EXISTS "serviceId",
  DROP COLUMN IF EXISTS "needId",
  DROP COLUMN IF EXISTS "needPetId";

ALTER TABLE "NeedV2" DROP COLUMN IF EXISTS "legacyNeedId";
ALTER TABLE "ServiceV2" DROP COLUMN IF EXISTS "legacyServiceId";

DROP TYPE IF EXISTS "NeedStatus";
DROP TYPE IF EXISTS "ServiceCategory";
DROP TYPE IF EXISTS "AvailabilityRangeType";
DROP TYPE IF EXISTS "AvailabilityWeekPattern";
DROP TYPE IF EXISTS "PriceUnit";
DROP TYPE IF EXISTS "ApplicationStatus";
DROP TYPE IF EXISTS "BookingStatus";
DROP TYPE IF EXISTS "FrequencyType";
DROP TYPE IF EXISTS "DistanceRange";
DROP TYPE IF EXISTS "TransportMethod";
DROP TYPE IF EXISTS "ServicePhotoKind";

-- Source markers no longer need a legacy branch after the old publishing
-- tables have been removed. Remove any orphaned references before narrowing
-- the enums; these rows could only point at the empty tables dropped above.
DELETE FROM "FavoriteV2" WHERE "targetSource"::text = 'LEGACY';
DELETE FROM "NeedApplicationV2" WHERE "needSource"::text = 'LEGACY';
DELETE FROM "ServiceBookingV2" WHERE "serviceSource"::text = 'LEGACY';
DELETE FROM "ConversationV2" WHERE "contextSource"::text = 'LEGACY';

ALTER TYPE "FavoriteTargetSourceV2" RENAME TO "FavoriteTargetSourceV2_old";
CREATE TYPE "FavoriteTargetSourceV2" AS ENUM ('V2');
ALTER TABLE "FavoriteV2" ALTER COLUMN "targetSource" TYPE "FavoriteTargetSourceV2" USING ("targetSource"::text::"FavoriteTargetSourceV2");
DROP TYPE "FavoriteTargetSourceV2_old";

ALTER TYPE "ConversationContextSourceV2" RENAME TO "ConversationContextSourceV2_old";
CREATE TYPE "ConversationContextSourceV2" AS ENUM ('V2');
ALTER TABLE "ConversationV2" ALTER COLUMN "contextSource" TYPE "ConversationContextSourceV2" USING ("contextSource"::text::"ConversationContextSourceV2");
ALTER TABLE "NeedApplicationV2" ALTER COLUMN "needSource" TYPE "ConversationContextSourceV2" USING ("needSource"::text::"ConversationContextSourceV2");
ALTER TABLE "ServiceBookingV2" ALTER COLUMN "serviceSource" TYPE "ConversationContextSourceV2" USING ("serviceSource"::text::"ConversationContextSourceV2");
DROP TYPE "ConversationContextSourceV2_old";
