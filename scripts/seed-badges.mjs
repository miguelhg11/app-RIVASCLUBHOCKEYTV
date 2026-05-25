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
  console.log("Checking if 'club_badges' table exists in Supabase...");
  const { error: probeError } = await supabase.from("club_badges").select("id").limit(1);

  if (probeError && probeError.message.includes("relation \"club_badges\" does not exist")) {
    console.error("\n========================================================");
    console.error("ERROR: La tabla 'club_badges' no existe en la base de datos.");
    console.error("Por favor, aplica la migración SQL antes de continuar:");
    console.error("  Archivo: supabase/migrations/010_club_badges.sql");
    console.error("Puedes copiar y pegar su contenido en el SQL Editor de tu Dashboard de Supabase.");
    console.error("========================================================\n");
    process.exit(2);
  } else if (probeError) {
    console.error("Error al probar la tabla:", probeError.message);
    process.exit(1);
  }

  console.log("Table exists! Loading seed JSON...");
  const seedPath = path.join(
    process.cwd(),
    "MINIATURAS YOUTUBE-APP",
    "ESCUDOS PARA STREAM",
    "inventario escudos-equipos",
    "club_badges_seed.json"
  );

  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found at: ${seedPath}`);
    process.exit(1);
  }

  const rawSeed = fs.readFileSync(seedPath, "utf8");
  const seedItems = JSON.parse(rawSeed);
  console.log(`Loaded ${seedItems.length} items from seed.`);

  // Mapear campos
  const dbItems = seedItems.map((item) => {
    // normalizar scope
    let scope = item.sourceScope;
    if (scope === "seleccion_autonomica" || scope === "selecciones") {
      scope = "seleccion_autonomica";
    }

    // El logo_url será la ruta estática local, ej. /badges/fmp/alameda.png
    // assetPath es badges/fmp/alameda.png, así que reemplazamos el badges inicial para que apunte a /badges/fmp/alameda.png
    const logoUrl = "/" + item.assetPath;

    return {
      source_scope: scope,
      canonical_name: item.canonicalTeamName,
      short_code: item.shortCode,
      aliases: item.aliases || [],
      normalized_aliases: item.normalizedAliases || [],
      logo_url: logoUrl,
    };
  });

  console.log("Inserting badges in batches of 50...");
  const batchSize = 50;
  for (let i = 0; i < dbItems.length; i += batchSize) {
    const batch = dbItems.slice(i, i + batchSize);
    const { error } = await supabase.from("club_badges").upsert(batch, { onConflict: "canonical_name" });
    if (error) {
      console.error(`Error inserting batch starting at index ${i}:`, error.message);
      process.exit(1);
    }
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dbItems.length / batchSize)}`);
  }

  console.log("Seeding completed successfully!");
}

main().catch(console.error);
