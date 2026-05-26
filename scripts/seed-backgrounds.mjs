import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Cargar .env.local
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

if (!fs.existsSync(envPath)) {
  console.error("No .env.local found");
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase configuration in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const FONDOS_DIR = path.join(process.cwd(), "docs", "FONDOS");
  if (!fs.existsSync(FONDOS_DIR)) {
    console.error(`Fondos directory not found at: ${FONDOS_DIR}`);
    process.exit(1);
  }

  console.log("Reading backgrounds from docs/FONDOS...");
  const files = fs.readdirSync(FONDOS_DIR).filter(file => file.toLowerCase().endsWith(".png"));
  console.log(`Found ${files.length} backgrounds to seed.`);

  // We will insert them one by one to avoid huge payload requests
  let count = 0;
  for (const file of files) {
    const filePath = path.join(FONDOS_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const base64 = `data:image/png;base64,${buffer.toString("base64")}`;
    
    // Clean name for display: e.g. "Lobo Amarillo_conVS.png" -> "Lobo Amarillo (Con VS)"
    // or "01_sumatoria.png" -> "01 Sumatoria"
    let name = path.parse(file).name;
    name = name
      .replace(/_conVS/gi, " (Con VS)")
      .replace(/_sumatoria/gi, " (Sumatoria)")
      .replace(/_/g, " ");

    // Check if default background
    const isDefault = file.toLowerCase() === "fondo_sumatoria.png" || file.toLowerCase() === "01_sumatoria.png";

    console.log(`Uploading ${file} as "${name}"... (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

    const payload = {
      name,
      url_path: `/docs/FONDOS/${file}`,
      base64_data: base64,
      is_default: isDefault,
      active: true
    };

    // Select first to check if it exists
    const { data: existing } = await supabase
      .from("thumbnail_backgrounds")
      .select("id")
      .eq("url_path", payload.url_path)
      .maybeSingle();

    let error;
    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("thumbnail_backgrounds")
        .update({
          name: payload.name,
          base64_data: payload.base64_data,
          is_default: payload.is_default,
          active: payload.active
        })
        .eq("id", existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("thumbnail_backgrounds")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      console.error(`Error uploading ${file}:`, error.message);
    } else {
      count++;
      console.log(`Uploaded ${count}/${files.length} successfully.`);
    }
  }

  console.log("Seeding backgrounds completed!");
}

main().catch(console.error);
