const fs = require("node:fs");
const path = require("node:path");

const allowedFiles = new Set([
  // These files mention precise-address terms only in privacy guidance,
  // safety examples, private owner/provider views, or assertions that those
  // values are not serialized into public DTOs.
  "src/i18n/messages/en.ts",
  "src/i18n/messages/ja.ts",
  "src/i18n/messages/zh.ts",
  "src/app/(app)/dashboard/settings/_components/location-settings.tsx",
  "src/app/(home)/_components/care-type-pages.tsx",
  "src/domain/marketplace/need-public-dto.test.ts",
  "src/app/(app)/dashboard/serviceprofile/_components/BaseInfoModal.tsx",
  "src/app/(app)/dashboard/serviceprofile/_components/ProfileHeader.tsx",
  "src/app/(app)/dashboard/serviceprofile/_components/ServiceProfile.tsx",
  "src/lib/zod/location.ts",
  "src/lib/zod/serviceProfile.ts",
  "src/modules/need-display/examples/home-visit-example-data.ts",
  "src/modules/need-publishing/i18n/messages.ts",
  "src/server/trpc/routers/dashboardSummary.ts",
  "src/server/trpc/routers/serviceProfile.ts",
  "src/utils/state_form.ts",
  "src/utils/state_need_form.ts"
]);
const forbidden = /addressRaw|baseAreaRaw|areaRaw|楼号|楼层|房号|门禁|部屋番号|建物番号|フロア|apartment number|room number/i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const failures = walk(path.join(process.cwd(), "src"))
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => path.relative(process.cwd(), file))
  .filter((file) => !allowedFiles.has(file))
  .filter((file) => forbidden.test(fs.readFileSync(path.join(process.cwd(), file), "utf8")));

if (failures.length) {
  process.stderr.write(`Forbidden precise-location names found outside the legacy allowlist:\n${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("Location privacy source check passed.\n");
