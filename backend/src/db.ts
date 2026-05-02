import { Pool, type PoolConfig } from "pg";
import { config } from "./config";

const ssl = config.databaseUrl.includes("neon.tech")
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool(buildPoolConfig());

export async function closePool() {
  await pool.end();
}

function buildPoolConfig(): PoolConfig {
  const options = `-c search_path=${config.databaseSchema},public`;
  const parsed = new URL(config.databaseUrl);

  if (!parsed.hostname) {
    return {
      user: decodeURIComponent(parsed.username || process.env.PGUSER || process.env.USER || "postgres"),
      password: decodeURIComponent(parsed.password || process.env.PGPASSWORD || ""),
      host: process.env.PGHOST || "/var/run/postgresql",
      port: Number(parsed.port || process.env.PGPORT || 5432),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "") || process.env.PGDATABASE || "macrochef"),
      options
    };
  }

  return {
    connectionString: config.databaseUrl,
    ssl,
    options
  };
}
