import fs from "fs";
import path from "path";
import { config } from "../config";
import { pool } from "../db";

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  if (config.databaseSchema !== "public") {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(config.databaseSchema)}`);
  }
  await pool.query(`SET search_path TO ${quoteIdentifier(config.databaseSchema)}, public`);

  const migrationsDir = path.join(__dirname, "../../migrations");
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
