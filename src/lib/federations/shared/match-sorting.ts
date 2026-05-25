// Helper for sorting matches
import { UnifiedFederationMatch } from "./federation-match";

export function getCategorySortOrder(categoryKey: string): number {
  const order: Record<string, number> = {
    // FEP
    "ok_liga_masculina": 10,
    "ok_liga_femenina": 15,
    "ok_plata_masculina": 20,
    "ok_plata_femenina": 25,
    
    // FMP / Shared
    "ok_plata": 20,
    "ok_bronce": 22,
    "ok_femenina": 15,
    "primera_nacional": 30,
    "primera_autonomica": 40,
    "segunda_autonomica": 41,
    "autonomica_masc_1": 40,
    "autonomica_masc_2": 41,
    "autonomica_fem": 42,
    "sub17": 45,
    "junior": 50,
    "juvenil": 60,
    "infantil": 70,
    "alevin": 80,
    "benjamin": 90,
    "prebenjamin": 100,
    "micros": 110,
    "veteranos": 120,
  };
  return order[categoryKey] ?? 999;
}

export function sortMatches(a: UnifiedFederationMatch, b: UnifiedFederationMatch): number {
  // 1. Sort by category (sporting order)
  const catA = getCategorySortOrder(a.categoryKey);
  const catB = getCategorySortOrder(b.categoryKey);
  if (catA !== catB) return catA - catB;

  // 2. Sort by letter
  const letterA = a.rivasTeamLetter ?? "Z";
  const letterB = b.rivasTeamLetter ?? "Z";
  if (letterA !== letterB) return letterA.localeCompare(letterB);

  // 3. Sort by date and time
  const dateA = a.datetimeIso;
  const dateB = b.datetimeIso;
  if (dateA && dateB) {
    const da = new Date(dateA).getTime();
    const db = new Date(dateB).getTime();
    if (da !== db) return da - db;
  }
  if (dateA && !dateB) return -1;
  if (!dateA && dateB) return 1;

  // Fallback to purely date (YYYY-MM-DD)
  const dStrA = a.date;
  const dStrB = b.date;
  if (dStrA !== dStrB) return dStrA.localeCompare(dStrB);

  return 0;
}

export function getUnifiedCategoryLabel(categoryKey: string, fallback: string): string {
  const labels: Record<string, string> = {
    "ok_liga_masculina": "OK Liga Masculina",
    "ok_liga_femenina": "OK Liga Femenina",
    "ok_plata": "OK Plata",
    "ok_bronce": "OK Bronce",
    "primera_nacional": "Primera Nacional",
    "primera_autonomica": "1ª Autonómica Masculina",
    "segunda_autonomica": "2ª Autonómica Masculina",
    "autonomica_masc_1": "1ª Autonómica Masculina",
    "autonomica_masc_2": "2ª Autonómica Masculina",
    "autonomica_fem": "Autonómica Femenina",
    "sub17": "Sub-17",
    "junior": "Junior",
    "juvenil": "Juvenil",
    "infantil": "Infantil",
    "alevin": "Alevín",
    "benjamin": "Benjamín",
    "prebenjamin": "Prebenjamín",
    "micros": "Micros / Iniciación",
    "veteranos": "Veteranos",
  };
  return labels[categoryKey] ?? fallback;
}

