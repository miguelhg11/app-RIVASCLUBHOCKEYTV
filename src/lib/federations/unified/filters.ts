import { UnifiedFederationMatch } from "../shared/federation-match";

export interface FilterOption {
  value: string;
  label: string;
}

export interface MatchFilters {
  sources: FilterOption[];
  categories: FilterOption[];
  teams: FilterOption[];
}

export function buildUnifiedTeamFilterOptions(matches: UnifiedFederationMatch[]): MatchFilters {
  const sources = new Map<string, string>();
  const categories = new Map<string, string>();
  const teams = new Map<string, string>();

  matches.forEach(m => {
    // Sources
    const sourceLabel = m.source === "rfep" ? "RFEP" : m.source === "fmp" ? "FMP" : "Manual";
    sources.set(m.source, sourceLabel);

    // Categories
    categories.set(m.categoryKey, m.categoryLabel);

    // Teams (Category + Letter)
    teams.set(m.rivasTeamKey, m.rivasTeamLabelFull);
  });

  return {
    sources: Array.from(sources.entries()).map(([value, label]) => ({ value, label })),
    categories: Array.from(categories.entries()).map(([value, label]) => ({ value, label })),
    teams: Array.from(teams.entries()).map(([value, label]) => ({ value, label })),
  };
}
