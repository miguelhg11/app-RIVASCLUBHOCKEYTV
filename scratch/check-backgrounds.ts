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

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  const { data: bgs, error } = await supabase.from("thumbnail_backgrounds").select("*");
  if (error) {
    console.error(error);
  } else {
    console.log("=== BACKGROUNDS ===");
    console.log(bgs.map(b => ({ id: b.id, name: b.name, url_path: b.url_path, is_default: b.is_default, has_base64: !!b.base64_data })));
  }
}

main().catch(console.error);
