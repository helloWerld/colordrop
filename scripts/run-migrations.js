#!/usr/bin/env node
/**
 * Run Supabase migrations from supabase/migrations/*.sql
 * Requires DATABASE_URL in .env.local (Postgres connection URI from Supabase Dashboard → Database)
 */
const fs = require("fs");
const path = require("path");

// Load .env.local then .env
function loadEnv() {
  const tryLoad = (file) => {
    const p = path.join(process.cwd(), file);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  };
  tryLoad(".env.local");
  tryLoad(".env");
}

loadEnv();

const { Client } = require("pg");

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
if (!fs.existsSync(migrationsDir)) {
  console.error("No supabase/migrations directory found.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL. Add it to .env.local (Supabase Dashboard → Database → Connection string → Use connection pooling → URI)."
  );
  process.exit(1);
}
if (databaseUrl.includes("db.") && databaseUrl.includes(".supabase.co") && !databaseUrl.includes("pooler")) {
  console.error(
    "DATABASE_URL looks like a direct DB URL (db.*.supabase.co). Use the pooler URI instead (host: aws-0-<region>.pooler.supabase.com, port 6543) to avoid ENOTFOUND."
  );
  process.exit(1);
}

const MIGRATIONS_TABLE = "schema_migrations";

async function run() {
  const client = new Client({ connectionString: databaseUrl });
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }
  try {
    await client.connect();

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        filename TEXT PRIMARY KEY
      )
    `);

    let { rows: applied } = await client.query(
      `SELECT filename FROM ${MIGRATIONS_TABLE}`
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // If no migrations recorded but DB already has schema, mark 001–004 as applied
    // so we only run new migrations (e.g. 005).
    if (appliedSet.size === 0) {
      const { rows: r } = await client.query(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
        LIMIT 1
      `);
      if (r.length > 0) {
        console.log("Existing schema detected; marking 001–004 as already applied.");
        for (const file of files) {
          if (file === "005_book_page_tier_crop_rotate.sql") break;
          await client.query(
            `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
            [file]
          );
          appliedSet.add(file);
        }
      }
    }

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log("Skipping", file, "(already applied)");
        continue;
      }
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");
      console.log("Running", file, "...");
      await client.query(sql);
      await client.query(
        `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
        [file]
      );
      console.log("  OK");
    }
    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
