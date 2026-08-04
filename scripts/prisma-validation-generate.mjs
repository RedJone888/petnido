import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "generate", "--schema", "prisma/validation/schema.prisma"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VALIDATION_DATABASE_URL: process.env.VALIDATION_DATABASE_URL || "file:/tmp/petnido-validation-generate.db",
    },
  },
);

process.exit(result.status ?? 1);
