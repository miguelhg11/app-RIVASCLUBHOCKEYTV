import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GET } from "../app/api/thumbnail/render/route.tsx";

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

async function main() {
  const { data: bgs } = await supabase.from("thumbnail_backgrounds").select("id, name").eq("name", "08 (Sumatoria)").limit(1);
  if (!bgs || bgs.length === 0) {
    console.log("No test background found");
    return;
  }
  const bg = bgs[0];
  console.log(`Using background: ${bg.name} (ID: ${bg.id})`);

  // Mock NextRequest
  const url = `http://localhost:3000/api/thumbnail/render?backgroundId=${bg.id}`;
  const req = {
    url,
    method: "GET",
  };

  console.log("Calling render API...");
  try {
    const res = await GET(req);
    if (res.status !== 200) {
      console.error("Failed to render:", res.status, await res.text());
      return;
    }
    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(path.join(__dirname, "render.png"), buffer);
    console.log("Successfully saved rendered image to scratch/render.png");
  } catch (err) {
    console.error("Error during rendering:", err);
  }
}

main().catch(console.error);
