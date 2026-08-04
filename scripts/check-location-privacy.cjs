const fs = require("node:fs");
const path = require("node:path");

const allowedLegacyFiles = new Set([
  "src/app/(app)/dashboard/needs/_components/NeedCard.tsx",
  "src/app/(app)/dashboard/needs/_components/form/NeedForm.tsx",
  "src/app/(app)/dashboard/serviceprofile/_components/BaseInfoModal.tsx",
  "src/app/(app)/dashboard/serviceprofile/_components/ProfileHeader.tsx",
  "src/app/(app)/dashboard/serviceprofile/_components/ServiceProfile.tsx",
  "src/app/(app)/dashboard/serviceprofile/services/_components/form/ServiceForm.tsx",
  "src/app/(app)/dashboard/serviceprofile/services/new/page.tsx",
  "src/app/(app)/public/needs/_components/NeedCard.tsx",
  "src/app/(app)/public/needs/_components/NeedDetailPage.tsx",
  "src/domain/need/constant.ts",
  "src/domain/need/form.types.ts",
  "src/domain/service/defaults.ts",
  "src/lib/need.ts",
  "src/lib/zod/location.ts",
  "src/lib/zod/needs.ts",
  "src/lib/zod/serviceProfile.ts",
  "src/lib/zod/services.ts",
  "src/server/domains/needs/queries.ts",
  "src/server/trpc/routers/need.ts",
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
  .filter((file) => !allowedLegacyFiles.has(file))
  .filter((file) => forbidden.test(fs.readFileSync(path.join(process.cwd(), file), "utf8")));

if (failures.length) {
  process.stderr.write(`Forbidden precise-location names found outside the legacy allowlist:\n${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("Location privacy source check passed.\n");
