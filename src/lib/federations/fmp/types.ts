export type FmpCategoryKey =
  | "ok_plata"
  | "ok_bronce"
  | "ok_femenina"
  | "autonomica_masc_1"
  | "autonomica_masc_2"
  | "autonomica_fem"
  | "sub17"
  | "junior"
  | "juvenil"
  | "infantil"
  | "alevin"
  | "benjamin"
  | "prebenjamin"
  | "micros"
  | "veteranos"
  | "otros";

export type FmpMatch = {
  source: "fmp";

  modalidad: "HOCKEY PATINES";

  competicion: string;
  categoriaKey: FmpCategoryKey;
  categoriaLabel: string;
  categoriaSortOrder: number;

  fecha: string; // formato original DD/MM/YYYY
  hora: string | null; // HH:mm o null si viene vacío
  local: string | null;
  visitante: string | null;
  resultado: string | null;
  pista: string | null;

  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string | null; // HH:mm
  scheduledStartIso: string | null; // Europe/Madrid si hay fecha y hora

  isRivasLocal: boolean;
  isRivasVisitante: boolean;
  hasDoubleRivasWarning: boolean;
  rivasTeamName: string | null;
  rivasTeamLetter: "A" | "B" | "C" | "D" | null;
  rivasTeamKey: string;
  rivasTeamLabelFull: string;
  rival: string | null;

  display: {
    fechaHora: string;
    partido: string;
    ubicacion: string;
  };

  sourceMatchId: string;
  sourceUrl: string;

  raw: unknown;
};

export type FmpMatchCategoryGroup = {
  categoriaKey: FmpCategoryKey;
  categoriaLabel: string;
  sortOrder: number;
  matches: FmpMatch[];
};
