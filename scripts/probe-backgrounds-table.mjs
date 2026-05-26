import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Probing columns of 'thumbnail_backgrounds'...");
  const { data, error } = await supabase.from("thumbnail_backgrounds").select("id, name, url_path, is_default, base64_data").limit(1);
  if (error) {
    console.error("Error probing columns:", error.message);
  } else {
    console.log("Columns are OK! Data found:", data);
  }
}

main().catch(console.error);
