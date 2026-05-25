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
  console.log("Listing all broadcasts to identify test records...");
  const { data: broadcasts, error: fetchError } = await supabase
    .from("broadcasts")
    .select("id, title");

  if (fetchError) {
    console.error("Error fetching broadcasts:", fetchError.message);
    return;
  }

  console.log("Found broadcasts:", broadcasts);

  const testTitles = [
    "JUVENIL: V.D. EUROPA - RIVAS B (Grabación)",
    "JUVENIL: RIVAS A - TRES CANTOS"
  ];

  const toDelete = broadcasts?.filter(b => testTitles.includes(b.title)) || [];

  if (toDelete.length === 0) {
    console.log("No test broadcasts found to delete.");
    return;
  }

  console.log(`Deleting ${toDelete.length} test broadcasts...`);
  const idsToDelete = toDelete.map(b => b.id);
  const { data: deleted, error: deleteError } = await supabase
    .from("broadcasts")
    .delete()
    .in("id", idsToDelete)
    .select();

  if (deleteError) {
    console.error("Error deleting broadcasts:", deleteError.message);
  } else {
    console.log("Successfully deleted broadcasts:", deleted);
  }
}

main().catch(console.error);
