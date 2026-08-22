-- "Other" care requests (custom needs) carry an optional preferred time of
-- day in addition to the earliest/latest date window.
CREATE TYPE "CustomTimePreferenceV2" AS ENUM ('FLEXIBLE', 'MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING', 'EXACT');

ALTER TABLE "NeedV2" ADD COLUMN "customTimePreference" "CustomTimePreferenceV2";
ALTER TABLE "NeedV2" ADD COLUMN "customExactTime" TEXT;
