import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not available after loading Next.js environment files.");
  process.exit(1);
}

const result = spawnSync(
  process.platform === "win32" ? "node_modules/.bin/prisma.cmd" : "node_modules/.bin/prisma",
  ["migrate", "deploy"],
  { cwd: process.cwd(), env: process.env, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
