#!/usr/bin/env node
/**
 * Create Supabase Storage buckets required by the app: originals, outlines, covers, pdfs.
 * Uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local (or .env).
 * Run: npm run storage:create-buckets
 */
const fs = require("fs");
const path = require("path");

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(url, serviceRoleKey);

const BUCKETS = ["originals", "outlines", "covers", "pdfs"];

async function main() {
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }
  const names = new Set((existing || []).map((b) => b.name));

  for (const name of BUCKETS) {
    if (names.has(name)) {
      console.log("Bucket already exists:", name);
      continue;
    }
    const { error } = await supabase.storage.createBucket(name, { public: false });
    if (error) {
      console.error("Failed to create bucket", name, error.message);
      process.exit(1);
    }
    console.log("Created bucket:", name);
  }
  console.log("Done.");
}

main();
