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
  const targetTitle = "Temporada 2021/2022";
  console.log(`Starting deletion process for broadcasts titled "${targetTitle}"...`);

  // Delete from local broadcasts
  const { data: bcs, error: bcErr } = await supabase
    .from("broadcasts")
    .delete()
    .eq("title", targetTitle)
    .select("id, title");

  if (bcErr) {
    console.error("Error deleting from broadcasts:", bcErr.message);
  } else {
    console.log("Deleted from broadcasts:", bcs);
  }

  // Delete from youtube_external_broadcasts
  const { data: exts, error: extErr } = await supabase
    .from("youtube_external_broadcasts")
    .delete()
    .eq("title", targetTitle)
    .select("id, title");

  if (extErr) {
    console.error("Error deleting from youtube_external_broadcasts:", extErr.message);
  } else {
    console.log("Deleted from youtube_external_broadcasts:", exts);
  }

  console.log("Cleanup completed.");
}

main().catch(console.error);
