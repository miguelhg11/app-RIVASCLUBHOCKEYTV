import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function getBackgroundBase64(id) {
  if (!id) return null;
  try {
    const { data, error } = await supabase
      .from("thumbnail_backgrounds")
      .select("base64_data, url_path")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      console.error("DB error or no data:", error);
      return null;
    }

    if (data.base64_data) {
      return data.base64_data.slice(0, 100) + "...";
    }

    if (data.url_path) {
      let cleanPath = data.url_path;
      if (cleanPath.startsWith("/")) {
        cleanPath = cleanPath.slice(1);
      }
      const fullPath = path.join(__dirname, "../", cleanPath);
      console.log("Checking file path:", fullPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        const ext = path.extname(cleanPath).toLowerCase().replace(".", "");
        const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        return `data:${mime};base64,${buffer.toString("base64").slice(0, 100)}...`;
      } else {
        console.error("File does not exist on disk:", fullPath);
      }
    }
  } catch (err) {
    console.error("Error fetching background:", err);
  }
  return null;
}

async function main() {
  // Query backgrounds first to get one ID
  const { data: bgs } = await supabase.from("thumbnail_backgrounds").select("id, name, url_path").limit(1);
  if (!bgs || bgs.length === 0) {
    console.log("No backgrounds found");
    return;
  }
  const bg = bgs[0];
  console.log(`Testing with background: ${bg.name} (ID: ${bg.id})`);
  const res = await getBackgroundBase64(bg.id);
  console.log("Result:", res);
}

main().catch(console.error);
