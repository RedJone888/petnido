import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function connectionSummary(raw) {
  if (!raw) return { configured: false, valid: false };
  try {
    const url = new URL(raw);
    const validProtocol = url.protocol === "postgresql:" || url.protocol === "postgres:";
    return {
      configured: true,
      valid: validProtocol && Boolean(url.hostname) && Boolean(url.pathname.slice(1)),
      host: url.hostname,
      port: url.port || "5432",
      database: url.pathname.slice(1) || null,
      sslMode: url.searchParams.get("sslmode") || null,
    };
  } catch {
    return { configured: true, valid: false };
  }
}

const database = connectionSummary(process.env.DATABASE_URL);
const direct = connectionSummary(process.env.DIRECT_URL);
const report = {
  readyForConnectionCheck: database.valid,
  database,
  direct,
  note: database.valid
    ? "Configuration shape is valid. This check did not open a database connection."
    : "Add a PostgreSQL DATABASE_URL to .env.local. Cloudinary credentials are unrelated to database access.",
};

console.log(JSON.stringify(report, null, 2));
if (!report.readyForConnectionCheck) process.exitCode = 1;
