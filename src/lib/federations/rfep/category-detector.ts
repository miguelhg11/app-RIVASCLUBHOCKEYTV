import { RFEP_LEAGUES } from "./rfep-leagues.config";

export interface DetectedCategory {
  categoryKey: string;
  categoryLabel: string;
}

export function detectCategoryFromLeague(leagueId: number, leagueName: string): DetectedCategory {
  // First try to match by ID
  const config = RFEP_LEAGUES.find(c => c.leagueId === leagueId);
  if (config) {
    return { categoryKey: config.categoryKey, categoryLabel: config.categoryLabel };
  }

  // If we don't have a static mapping, try guessing based on name
  const upName = leagueName.toUpperCase();
  if (upName.includes("OK LIGA") && upName.includes("MASC")) {
    return { categoryKey: "ok_liga_masculina", categoryLabel: "OK Liga Masculina" };
  }
  if (upName.includes("OK PLATA") && upName.includes("MASC")) {
    return { categoryKey: "ok_plata_masculina", categoryLabel: "OK Plata Masculina" };
  }
  if (upName.includes("OK LIGA") && upName.includes("FEM")) {
    return { categoryKey: "ok_liga_femenina", categoryLabel: "OK Liga Femenina" };
  }
  if (upName.includes("OK PLATA") && upName.includes("FEM")) {
    return { categoryKey: "ok_plata_femenina", categoryLabel: "OK Plata Femenina" };
  }

  // Fallback
  return { categoryKey: "nacional", categoryLabel: leagueName };
}
