export type FederationSource = "fmp" | "rfep" | "manual";

export type FederationMatch = {
  id: string;
  source: FederationSource;
  competitionName: string;
  scheduledStart: string;
  venue: string;
  homeTeamName: string;
  awayTeamName: string;
  confidence: number;
  rawUrl: string | null;

  // FMP specific optional fields
  modalidad?: "HOCKEY PATINES";
  competicion?: string;
  categoriaKey?: string;
  categoriaLabel?: string;
  categoriaSortOrder?: number;
  fecha?: string;
  hora?: string | null;
  resultado?: string | null;
  pista?: string | null;
  scheduledDate?: string;
  scheduledTime?: string | null;
  scheduledStartIso?: string | null;
  isRivasLocal?: boolean;
  isRivasVisitante?: boolean;
  rival?: string | null;
  display?: {
    fechaHora: string;
    partido: string;
    ubicacion: string;
  };
  sourceMatchId?: string;
  raw?: unknown;
};

