const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const migrationPath = path.join(
  root,
  "prisma/migrations/20260804060000_publishing_v2_expand/migration.sql",
);
const quantityMigrationPath = path.join(
  root,
  "prisma/migrations/20260804071000_need_pet_snapshot_quantity/migration.sql",
);
const publishCompletionMigrationPath = path.join(
  root,
  "prisma/migrations/20260804072000_need_publish_completion_fields/migration.sql",
);
const needEditMigrationPath = path.join(
  root,
  "prisma/migrations/20260804073000_need_edit_drafts/migration.sql",
);
const servicePublishCompletionMigrationPath = path.join(
  root,
  "prisma/migrations/20260804074000_service_publish_completion_fields/migration.sql",
);
const legacyOriginsMigrationPath = path.join(
  root,
  "prisma/migrations/20260804075000_publishing_v2_legacy_origins/migration.sql",
);
const favoritesMigrationPath = path.join(
  root,
  "prisma/migrations/20260804080000_favorites_v2/migration.sql",
);
const conversationsMigrationPath = path.join(
  root,
  "prisma/migrations/20260804081000_conversations_v2/migration.sql",
);
const applicationsMigrationPath = path.join(
  root,
  "prisma/migrations/20260804082000_need_applications_v2/migration.sql",
);
const bookingsMigrationPath = path.join(
  root,
  "prisma/migrations/20260804083000_service_bookings_v2/migration.sql",
);
const notificationsMigrationPath = path.join(
  root,
  "prisma/migrations/20260804084000_notifications_v2/migration.sql",
);
const emailOutboxMigrationPath = path.join(
  root,
  "prisma/migrations/20260804085000_email_outbox_v2/migration.sql",
);
const schemaPath = path.join(root, "prisma/schema.prisma");
const migration = [
  migrationPath,
  quantityMigrationPath,
  publishCompletionMigrationPath,
  needEditMigrationPath,
  servicePublishCompletionMigrationPath,
  legacyOriginsMigrationPath,
  favoritesMigrationPath,
  conversationsMigrationPath,
  applicationsMigrationPath,
  bookingsMigrationPath,
  notificationsMigrationPath,
  emailOutboxMigrationPath,
]
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const schema = fs.readFileSync(schemaPath, "utf8");

const failures = [];
// The boarding task schedule columns were deliberately retired once the task
// editor stopped collecting per-frequency details; allow dropping exactly
// those columns while keeping every other migration safety rule intact.
const allowedDropColumns = /ALTER\s+TABLE\s+"NeedTaskV2"\s+DROP\s+COLUMN\s+"(localTimes|intervalDays|dueDate|trigger)"/gi;
const migrationForSafety = migration.replace(allowedDropColumns, "");
const destructivePatterns = [
  /DROP\s+(TABLE|TYPE|COLUMN)/i,
  /TRUNCATE\s+/i,
  /DELETE\s+FROM/i,
  /UPDATE\s+"?(User|Profile|Pet|Need|Service|NeedPet|PriceRule|Attachment)"?/i,
  /ALTER\s+TABLE\s+"(User|Profile|Pet|Need|Service|NeedPet|PriceRule|Attachment)"\s+(DROP|ALTER|RENAME)/i,
];
for (const pattern of destructivePatterns) {
  if (pattern.test(migrationForSafety)) failures.push(`forbidden migration operation: ${pattern}`);
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
  "FavoriteV2",
  "ConversationV2",
  "ConversationParticipantV2",
  "MessageV2",
  "NeedApplicationV2",
  "ServiceBookingV2",
  "ServiceBookingPetV2",
  "NotificationV2",
  "EmailOutboxV2",
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
  "NeedPetSnapshotV2_quantity_check",
  "Pet_quantity_check",
  "Pet_weight_check",
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
