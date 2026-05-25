import { load } from "cheerio";
import type { FmpMatch } from "@/src/lib/federations/fmp/types";
import { isRivasTeam, getRivasTeamRoles, buildRivasTeamKey, buildRivasTeamLabel } from "@/src/lib/federations/shared/club-identity";
import { parseSpanishDateToIsoDate, buildMadridDateTimeIso } from "@/src/lib/federations/shared/date-range";
import { createFmpSourceMatchId } from "@/src/lib/federations/fmp/normalizer";
import { detectFmpCategory, FMP_CATEGORY_ORDER, compareFmpMatchesByDateTime } from "@/src/lib/federations/fmp/category";
import { formatFmpDateTimeForDisplay, formatFmpMatchTitle, formatFmpVenue } from "@/src/lib/federations/fmp/formatters";
function clean(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function emptyToNull(value: string): string | null {
  const cleaned = clean(value);
  return cleaned === "" ? null : cleaned;
}

export function parseFmpTable(html: string): FmpMatch[] {
  const $ = load(html);
  const rows = $(".fila_agenda");
  const out: FmpMatch[] = [];

  // Get current date range in Europe/Madrid (today to today + 7 days)
  const todayMadridStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // Formats as YYYY-MM-DD
  const todayMadrid = new Date(todayMadridStr);
  const maxDateMadrid = new Date(todayMadrid);
  maxDateMadrid.setDate(maxDateMadrid.getDate() + 7);

  rows.each((_, row) => {
    const param = clean($(row).attr("param_game"));
    const parts = param.split("_");

    // FMP has different modalities, we check if modality ID in param_game is '1' (HOCKEY PATINES)
    // or if the first cell text is 'HP' (Hockey Patines)
    const tds = $(row).children("td");
    if (tds.length < 7) return;

    let modality = "";
    let rawCompeticion = "";
    let rawFecha = "";
    let rawHora = "";
    let rawLocal = "";
    let rawVisitante = "";
    let rawResultado = "";
    let rawPista = "";

    if (tds.length >= 10) {
      modality = clean($(tds[0]).text());
      rawCompeticion = clean($(tds[1]).text());
      rawFecha = clean($(tds[2]).text());
      rawHora = clean($(tds[3]).text());
      rawLocal = clean($(tds[5]).text());
      rawVisitante = clean($(tds[7]).text());
      rawResultado = clean($(tds[8]).text());
      rawPista = clean($(tds[9]).text());
    } else {
      // Fallback mapping if structure has exactly 7 columns
      rawCompeticion = clean($(tds[0]).text());
      rawFecha = clean($(tds[1]).text());
      rawHora = clean($(tds[2]).text());
      rawLocal = clean($(tds[3]).text());
      rawVisitante = clean($(tds[4]).text());
      rawResultado = clean($(tds[5]).text());
      rawPista = clean($(tds[6]).text());
    }

    // Validation: Check modality matches HOCKEY PATINES
    const isHPParam = parts[0] === "1";
    const isHPText = modality === "HP" || modality.toLowerCase().includes("hockey patines") || tds.length === 7;
    if (!isHPParam && !isHPText) return;

    // Filter Rivas team (local or visitor)
    const matchesRivas = isRivasTeam(rawLocal) || isRivasTeam(rawVisitante) || parts.includes("395");
    if (!matchesRivas) return;

    if (!rawCompeticion || !rawFecha || (!rawLocal && !rawVisitante)) return;

    // Dates check
    let scheduledDate: string;
    try {
      scheduledDate = parseSpanishDateToIsoDate(rawFecha);
    } catch {
      return; // Skip if date is completely invalid
    }

    const matchDate = new Date(scheduledDate);
    // Range check: between today and today + 7 days (both inclusive)
    if (Number.isNaN(matchDate.getTime()) || matchDate < todayMadrid || matchDate > maxDateMadrid) {
      return;
    }

    const competicion = rawCompeticion;
    const fecha = rawFecha;
    const hora = emptyToNull(rawHora);
    const local = emptyToNull(rawLocal);
    const visitante = emptyToNull(rawVisitante);
    const resultado = emptyToNull(rawResultado);
    const pista = emptyToNull(rawPista);

    const scheduledTime = hora;
    const scheduledStartIso = buildMadridDateTimeIso(fecha, hora);

    const {
      isRivasLocal: isRivasLocalVal,
      isRivasVisitor: isRivasVisitanteVal,
      hasDoubleRivasWarning,
      rivasTeamName,
      rivasLetter: rivasTeamLetter,
    } = getRivasTeamRoles(local || "", visitante || "");

    let rival: string | null = null;
    if (isRivasLocalVal && !isRivasVisitanteVal) {
      rival = visitante;
    } else if (!isRivasLocalVal && isRivasVisitanteVal) {
      rival = local;
    }

    const sourceMatchId = createFmpSourceMatchId({
      modalidad: "HOCKEY PATINES",
      competicion,
      fecha,
      hora,
      local: local || "",
      visitante: visitante || "",
      pista: pista || "",
    });

    const { key: categoriaKey, label: categoriaLabel } = detectFmpCategory(competicion);
    const categoriaSortOrder = FMP_CATEGORY_ORDER[categoriaKey];

    const rivasTeamKey = buildRivasTeamKey(categoriaKey, rivasTeamLetter);
    const rivasTeamLabelFull = buildRivasTeamLabel(categoriaLabel, rivasTeamLetter);

    const display = {
      fechaHora: formatFmpDateTimeForDisplay({ scheduledDate, scheduledTime }),
      partido: formatFmpMatchTitle({ local, visitante }),
      ubicacion: formatFmpVenue({ pista }),
    };

    const cellsText: string[] = [];
    tds.each((_, td) => {
      cellsText.push(clean($(td).text()));
    });

    out.push({
      source: "fmp",
      modalidad: "HOCKEY PATINES",
      competicion,
      fecha,
      hora,
      local,
      visitante,
      resultado,
      pista,
      scheduledDate,
      scheduledTime,
      scheduledStartIso,
      isRivasLocal: isRivasLocalVal,
      isRivasVisitante: isRivasVisitanteVal,
      hasDoubleRivasWarning,
      rivasTeamName,
      rivasTeamLetter,
      rivasTeamKey,
      rivasTeamLabelFull,
      rival,
      categoriaKey,
      categoriaLabel,
      categoriaSortOrder,
      display,
      sourceMatchId,
      sourceUrl: "https://competiciones.fmp.es/",
      raw: { cells: cellsText },
    });
  });

  return out.sort(compareFmpMatchesByDateTime);
}
