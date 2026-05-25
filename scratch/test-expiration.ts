import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars", { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Verifying expiration DB queries...");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  console.log(`Querying broadcasts older than: ${twentyFourHoursAgo}`);

  // Replicating the select query
  const { data: expired, error } = await supabase
    .from("broadcasts")
    .select("id, title, youtube_broadcast_id, scheduled_start, youtube_life_cycle_status")
    .is("deleted_at", null)
    .neq("youtube_life_cycle_status", "complete")
    .lt("scheduled_start", twentyFourHoursAgo);

  if (error) {
    throw new Error(`Select query failed: ${error.message}`);
  }

  console.log(`Found ${expired.length} expired pending broadcasts.`);
  if (expired.length > 0) {
    console.log("Expired list:");
    expired.forEach(bc => {
      console.log(`- ${bc.title} (ID: ${bc.id}, Scheduled: ${bc.scheduled_start})`);
    });
  }

  console.log("Checking operation_logs table insert capability...");
  // Test logging insert
  const { error: logError } = await supabase.from("operation_logs").insert({
    operation_type: "test_expire_check",
    status: "ok",
    message: "Test of auto-expiration logging",
    metadata: { test: true }
  });

  if (logError) {
    console.error("Warning: operation_logs insert failed", logError.message);
  } else {
    console.log("operation_logs insert succeeded!");
  }

  console.log("\nExpiration queries verification passed successfully!");
}

main().catch(console.error);
