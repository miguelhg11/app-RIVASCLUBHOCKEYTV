import { FmpMatch, FmpCategoryKey, FmpMatchCategoryGroup } from "./types";

export const FMP_CATEGORY_ORDER: Record<FmpCategoryKey, number> = {
  ok_plata: 10,
  ok_bronce: 20,
  ok_femenina: 30,
  autonomica_masc_1: 40,
  autonomica_masc_2: 50,
  autonomica_fem: 60,
  sub17: 70,
  junior: 80,
  juvenil: 90,
  infantil: 100,
  alevin: 110,
  benjamin: 120,
  prebenjamin: 130,
  micros: 140,
  veteranos: 150,
  otros: 999,
};

export function normalizeCompetitionText(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectFmpCategory(competicion: string): { key: FmpCategoryKey; label: string } {
  const norm = normalizeCompetitionText(competicion);

  if (norm.includes("ok plata") || norm.includes("plata")) return { key: "ok_plata", label: "OK Plata" };
  if (norm.includes("ok bronce") || norm.includes("bronce")) return { key: "ok_bronce", label: "OK Bronce" };
  if (norm.includes("ok liga femenina") || norm.includes("ok femenina")) return { key: "ok_femenina", label: "OK Liga Femenina" };
  if (norm.includes("1a autonomica masc") || norm.includes("1ª autonomica masc") || norm.includes("primera autonomica masc")) return { key: "autonomica_masc_1", label: "1ª Autonómica Masculina" };
  if (norm.includes("2a autonomica masc") || norm.includes("2ª autonomica masc") || norm.includes("segunda autonomica masc")) return { key: "autonomica_masc_2", label: "2ª Autonómica Masculina" };
  if (norm.includes("autonomica fem") || norm.includes("autonomica femenina")) return { key: "autonomica_fem", label: "Autonómica Femenina" };
  if (norm.includes("sub 17") || norm.includes("sub-17") || norm.includes("sub17")) return { key: "sub17", label: "Sub-17" };
  if (norm.includes("junior")) return { key: "junior", label: "Junior" };
  if (norm.includes("juvenil")) return { key: "juvenil", label: "Juvenil" };
  if (norm.includes("infantil")) return { key: "infantil", label: "Infantil" };
  if (norm.includes("alevin")) return { key: "alevin", label: "Alevín" };
  if (norm.includes("benjamin")) return { key: "benjamin", label: "Benjamín" };
  if (norm.includes("prebenjamin") || norm.includes("pre-benjamin")) return { key: "prebenjamin", label: "Prebenjamín" };
  if (norm.includes("micro") || norm.includes("iniciacion")) return { key: "micros", label: "Micros / Iniciación" };
  if (norm.includes("veterano")) return { key: "veteranos", label: "Veteranos" };

  return { key: "otros", label: "Otros" };
}

export function compareFmpMatchesByDateTime(a: FmpMatch, b: FmpMatch): number {
  if (a.scheduledDate !== b.scheduledDate) {
    return a.scheduledDate.localeCompare(b.scheduledDate);
  }
  
  if (!a.scheduledTime && b.scheduledTime) return 1;
  if (a.scheduledTime && !b.scheduledTime) return -1;
  
  if (a.scheduledTime && b.scheduledTime && a.scheduledTime !== b.scheduledTime) {
    return a.scheduledTime.localeCompare(b.scheduledTime);
  }
  
  return 0;
}

export function groupFmpMatchesByCategory(matches: FmpMatch[]): FmpMatchCategoryGroup[] {
  const groupsMap = new Map<FmpCategoryKey, FmpMatchCategoryGroup>();

  for (const match of matches) {
    if (!groupsMap.has(match.categoriaKey)) {
      groupsMap.set(match.categoriaKey, {
        categoriaKey: match.categoriaKey,
        categoriaLabel: match.categoriaLabel,
        sortOrder: match.categoriaSortOrder,
        matches: [],
      });
    }
    groupsMap.get(match.categoriaKey)!.matches.push(match);
  }

  const groups = Array.from(groupsMap.values());

  groups.sort((a, b) => a.sortOrder - b.sortOrder);

  for (const group of groups) {
    group.matches.sort(compareFmpMatchesByDateTime);
  }

  return groups;
}
