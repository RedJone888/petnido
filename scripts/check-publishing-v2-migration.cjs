const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const migrationPath = path.join(
  root,
  "prisma/migrations/20260804060000_publishing_v2_expand/migration.sql",
);
const schemaPath = path.join(root, "prisma/schema.prisma");
const migration = fs.readFileSync(migrationPath, "utf8");
const schema = fs.readFileSync(schemaPath, "utf8");

const failures = [];
const destructivePatterns = [
  /DROP\s+(TABLE|TYPE|COLUMN)/i,
  /TRUNCATE\s+/i,
  /DELETE\s+FROM/i,
  /UPDATE\s+"?(User|Profile|Pet|Need|Service|NeedPet|PriceRule|Attachment)"?/i,
  /ALTER\s+TABLE\s+"(User|Profile|Pet|Need|Service|NeedPet|PriceRule|Attachment)"/i,
];
for (const pattern of destructivePatterns) {
  if (pattern.test(migration)) failures.push(`forbidden migration operation: ${pattern}`);
}

for (const table of [
  "PublishDraftV2",
  "LocationSnapshotV2",
  "NeedV2",
  "NeedPetSnapshotV2",
  "NeedTaskV2",
  "ServiceV2",
  "ServiceAvailabilityRuleV2",
  "ServicePetPolicyV2",
]) {
  if (!migration.includes(`CREATE TABLE "${table}"`)) {
    failures.push(`missing table: ${table}`);
  }
}

for (const constraint of [
  "LocationSnapshotV2_coordinate_check",
  "NeedV2_date_range_check",
  "NeedV2_money_check",
  "NeedTaskV2_schedule_check",
  "ServiceV2_mode_capacity_radius_check",
]) {
  if (!migration.includes(constraint)) failures.push(`missing constraint: ${constraint}`);
}

const v2Schema = schema.slice(schema.indexOf("model PublishDraftV2"));
for (const forbiddenField of ["addressRaw", "areaRaw", "baseAreaRaw"]) {
  if (v2Schema.includes(forbiddenField)) {
    failures.push(`precise/raw location field leaked into V2 schema: ${forbiddenField}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Publishing V2 migration safety check passed: expand-only, required tables/constraints present, no raw location fields.");
