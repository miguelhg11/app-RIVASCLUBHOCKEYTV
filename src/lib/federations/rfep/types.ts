import { FederationMatch } from "../types";

export interface RfepLeagueConfig {
  leagueId: number;
  nameHint: string;
  categoryKey: string;
  categoryLabel: string;
}

// Any RFEP specific types can go here.
// The parser will output FederationMatch directly, which is the unified format,
// but for now, we just ensure it follows the structure needed.
