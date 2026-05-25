export function normalizeTeamName(name: string): string {
  if (!name) return "";

  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\./g, "") // remove periods
    .replace(/\s+/g, " ") // normalize spaces
    .trim();
}

export function isRivasTeam(teamName: string): boolean {
  const normalized = normalizeTeamName(teamName);
  
  // Exclusions
  if (normalized.includes("UP RIVAS") || normalized.includes("VELOCIDAD RIVAS") || normalized.includes("ROZAS")) {
    return false;
  }

  // Token-based check: match exact word boundary
  return /\bRIVAS\b/.test(normalized);
}

export function extractRivasLetter(teamName: string): "A" | "B" | "C" | "D" | null {
  if (!isRivasTeam(teamName)) return null;
  const normalized = normalizeTeamName(teamName);
  
  // Look for A, B, C, D as isolated tokens at the end or near the end.
  const tokens = normalized.split(" ");
  for (const token of tokens.reverse()) {
    if (token === "A" || token === "B" || token === "C" || token === "D") {
      return token as "A" | "B" | "C" | "D";
    }
  }
  return null;
}

export function buildRivasTeamKey(categoryKey: string, letter: "A" | "B" | "C" | "D" | null): string {
  if (!letter) return categoryKey;
  return `${categoryKey}-${letter}`;
}

export function buildRivasTeamLabel(categoryLabel: string, letter: "A" | "B" | "C" | "D" | null): string {
  if (!letter) return categoryLabel;
  return `${categoryLabel} ${letter}`;
}

export interface MatchRoles {
  isRivasLocal: boolean;
  isRivasVisitor: boolean;
  hasDoubleRivasWarning: boolean;
  rivasTeamName: string | null;
  rivasLetter: "A" | "B" | "C" | "D" | null;
}

export function getRivasTeamRoles(localTeam: string, visitorTeam: string): MatchRoles {
  const isLocal = isRivasTeam(localTeam);
  const isVisitor = isRivasTeam(visitorTeam);
  const double = isLocal && isVisitor;

  let name: string | null = null;
  let letter: "A" | "B" | "C" | "D" | null = null;

  if (isLocal && !isVisitor) {
    name = localTeam;
    letter = extractRivasLetter(localTeam);
  } else if (isVisitor && !isLocal) {
    name = visitorTeam;
    letter = extractRivasLetter(visitorTeam);
  } else if (double) {
    // Both are Rivas. We just pick local to represent the "main" one for the calendar, or visitor...
    // The requirement says "return warnings if both are Rivas"
    name = localTeam; // Arbitrarily pick local for the label, or keep it generic
    letter = extractRivasLetter(localTeam);
  }

  return {
    isRivasLocal: isLocal,
    isRivasVisitor: isVisitor,
    hasDoubleRivasWarning: double,
    rivasTeamName: name,
    rivasLetter: letter,
  };
}
