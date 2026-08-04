import fs from "node:fs";
import path from "node:path";

export default function globalTeardown() {
  const databasePath = path.join(process.cwd(), "prisma", "validation", "validation.e2e.db");
  fs.rmSync(databasePath, { force: true });
  fs.rmSync(`${databasePath}-journal`, { force: true });
}
