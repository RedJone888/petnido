import { spawnSync } from "node:child_process";

const databaseUrl = process.env.TEST_DATABASE_URL;
const allowReset = process.env.ALLOW_TEST_DB_RESET === "true";

if (!databaseUrl || !allowReset || process.env.NODE_ENV !== "test") {
  process.stderr.write(
    "Refusing reset. Require NODE_ENV=test, ALLOW_TEST_DB_RESET=true, and TEST_DATABASE_URL.\n",
  );
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.replace(/^\//, "").toLowerCase();
if (!databaseName.includes("test")) {
  process.stderr.write("Refusing reset: database name must contain 'test'.\n");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "reset", "--force", "--skip-seed"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl } },
);
if (result.status !== 0) process.exit(result.status ?? 1);

const seed = spawnSync(process.execPath, ["prisma/seed-test.mjs"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});
process.exit(seed.status ?? 1);
