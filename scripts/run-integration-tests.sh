#!/bin/sh
set -eu

validation_db_path="prisma/validation/validation.integration.db"
export VALIDATION_DATABASE_URL="file:./validation.integration.db"
export NODE_ENV="test"
# Prisma 5's macOS schema engine returns an empty generic error for first-time SQLite creation at lower log levels.
export RUST_LOG="debug"

cleanup() {
  rm -f "$validation_db_path" "$validation_db_path-journal"
}
trap cleanup EXIT
cleanup

npx prisma db push --schema prisma/validation/schema.prisma --skip-generate
node scripts/install-validation-triggers.mjs
npx vitest run --project integration
