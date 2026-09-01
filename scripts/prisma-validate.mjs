import { spawnSync } from "node:child_process";

const validationUrl = "postgresql://user:pass@localhost:5432/petnido_validation";
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "validate"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || validationUrl },
});

process.exit(result.status ?? 1);
