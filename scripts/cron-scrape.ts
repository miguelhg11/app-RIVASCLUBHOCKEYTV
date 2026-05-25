import fs from "node:fs";
import path from "node:path";

// 1. Load local env file for local testing (not needed in GitHub Actions where vars are injected directly)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
loadEnvFile();

import { getRivasOfficialMatches } from "../src/lib/federations/unified/get-rivas-official-matches";

async function main() {
  console.log("==============================================");
  console.log("Iniciando cron de scraping unificado...");
  console.log(`Club FMP: ${process.env.FMP_CLUB_NAME}`);
  console.log(`Club RFEP: ${process.env.RFEP_CLUB_NAME}`);
  console.log("==============================================");

  const startTime = Date.now();

  // Forzar actualización y escritura en Supabase
  const matches = await getRivasOfficialMatches("cron@system", true, { forceRefresh: true });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("==============================================");
  console.log(`¡Scraping completado en ${durationSec}s!`);
  console.log(`Total de partidos cacheados en Supabase: ${matches.length}`);
  console.log("==============================================");
}

main().catch((err) => {
  console.error("Error fatal ejecutando el cron de scraping:", err);
  process.exit(1);
});
