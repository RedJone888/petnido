import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export default function globalSetup() {
  const databasePath = path.join(process.cwd(), "prisma", "validation", "validation.e2e.db");
  fs.rmSync(databasePath, { force: true });
  fs.rmSync(`${databasePath}-journal`, { force: true });

  const environment = {
    ...process.env,
    VALIDATION_DATABASE_URL: "file:./validation.e2e.db",
    RUST_LOG: "debug",
  };
  const push = spawnSync(
    path.join(process.cwd(), "node_modules", ".bin", "prisma"),
    ["db", "push", "--schema", "prisma/validation/schema.prisma", "--skip-generate"],
    { stdio: "inherit", env: environment },
  );
  if (push.status !== 0) throw new Error("Failed to prepare validation database");

  const trigger = spawnSync(process.execPath, ["scripts/install-validation-triggers.mjs"], {
    stdio: "inherit",
    env: environment,
  });
  if (trigger.status !== 0) throw new Error("Failed to install validation constraints");

  const seedProfile = spawnSync(
    process.execPath,
    ["scripts/seed-validation-profile.mjs"],
    { stdio: "inherit", env: environment },
  );
  if (seedProfile.status !== 0) {
    throw new Error("Failed to seed profile settings validation data");
  }
}
