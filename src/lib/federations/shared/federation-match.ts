export type FederationSource = "fmp" | "rfep" | "manual";
export type FederationTeamLetter = "A" | "B" | "C" | "D" | null;

export interface UnifiedFederationMatch {
  id: string; // Unique identifier for the match
  source: FederationSource;
  
  // Date and Time
  datetimeIso: string | null; // e.g. "2026-05-24T09:30:00+02:00"
  date: string; // e.g. "24/05/2026"
  time: string | null; // e.g. "09:30"
  
  // Teams and Match details
  localTeam: string;
  visitorTeam: string;
  competitionName: string;
  categoryKey: string;
  categoryLabel: string;
  location: string;
  status: "SCHEDULED" | "FINISHED" | "CANCELLED" | "UNKNOWN";
  score: string | null;
  
  // Rivas specific properties
  isRivas: boolean; // True if either team is Rivas
  isRivasLocal: boolean;
  isRivasVisitor: boolean;
  hasDoubleRivasWarning: boolean;
  rivasTeamName: string | null; // The raw normalized name of the Rivas team
  rivasTeamLetter: FederationTeamLetter;
  rivasTeamKey: string; // categoryKey + "-" + rivasTeamLetter
  rivasTeamLabelFull: string; // categoryLabel + " " + rivasTeamLetter
  rival: string | null;
  
  // Original source raw data for debugging/display
  rawUrl?: string;
  raw?: unknown;
}

// In the codebase we might still have FmpMatch, so we should convert it or just use UnifiedFederationMatch everywhere.
