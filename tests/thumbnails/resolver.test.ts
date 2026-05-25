import fs from "node:fs";
import path from "node:path";

// Cargar .env.local de forma robusta
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

import { test } from "node:test";
import assert from "node:assert";

test("resolveBadgeForTeam resolves Rivas shield correctly for various aliases", async () => {
  const { resolveBadgeForTeam } = await import("../../src/lib/thumbnails/resolver");
  const cases = [
    "CP RIVAS LAS LAGUNAS",
    "CP RIVAS LAS LAGUNAS A",
    "CP RIVAS LAS LAGUNAS B",
    "ADISS HOCKEY RIVAS",
    "RIVAS A",
    "Rivas B",
    "Hockey Rivas",
  ];

  for (const team of cases) {
    const res = await resolveBadgeForTeam(team);
    assert.strictEqual(res.isRivas, true, `Should identify '${team}' as Rivas`);
    assert.strictEqual(res.logoUrl, "/badges/fmp/rivas.png");
    assert.strictEqual(res.matchType, "rivas");
  }
});

test("resolveBadgeForTeam resolves known clubs exactly or by alias", async () => {
  const { resolveBadgeForTeam } = await import("../../src/lib/thumbnails/resolver");
  
  // Test Alameda de Osuna (known in seed)
  const alamedaRes = await resolveBadgeForTeam("Colegio Alameda de Osuna");
  assert.strictEqual(alamedaRes.isRivas, false);
  assert.strictEqual(alamedaRes.logoUrl, "/badges/fmp/alameda.png");

  // Test CHP Aluche (known alias in seed)
  const alucheRes = await resolveBadgeForTeam("CHP ALUCHE");
  assert.strictEqual(alucheRes.isRivas, false);
  assert.strictEqual(alucheRes.logoUrl, "/badges/fmp/aluche.png");
});

test("resolveBadgeForTeam falls back to a default shield for unknown teams", async () => {
  const { resolveBadgeForTeam } = await import("../../src/lib/thumbnails/resolver");
  
  const fallbackRes = await resolveBadgeForTeam("CLUB DE HOCKEY INVENTADO DE PRUEBA");
  assert.strictEqual(fallbackRes.isRivas, false);
  assert.strictEqual(fallbackRes.logoUrl, "/badges/fmp/rivas.png"); // fallback logo url
  assert.strictEqual(fallbackRes.matchType, "fallback");
});
