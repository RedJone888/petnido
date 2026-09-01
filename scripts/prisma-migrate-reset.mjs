import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.argv.includes("--confirm-delete-all")) {
  console.error("Refusing reset. Pass --confirm-delete-all after explicit approval.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not available after loading Next.js environment files.");
  process.exit(1);
}

const target = new URL(process.env.DATABASE_URL);
console.log(`Resetting PostgreSQL schema at ${target.hostname}:${target.port || "5432"}/${target.pathname.slice(1)}.`);
const result = spawnSync(
  process.platform === "win32" ? "node_modules/.bin/prisma.cmd" : "node_modules/.bin/prisma",
  ["migrate", "reset", "--force", "--skip-seed"],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
