import * as cheerio from "cheerio";
import { UnifiedFederationMatch } from "../shared/federation-match";
import { buildMadridDateTimeIso } from "../shared/date-utils";
import { normalizeTeamName, getRivasTeamRoles, buildRivasTeamKey, buildRivasTeamLabel } from "../shared/club-identity";
import { detectCategoryFromLeague } from "./category-detector";

export function parseRfepCalendarHtml(html: string, leagueId: number, leagueName: string): UnifiedFederationMatch[] {
  const $ = cheerio.load(html);
  const matches: UnifiedFederationMatch[] = [];
  const { categoryKey, categoryLabel } = detectCategoryFromLeague(leagueId, leagueName);

  $("tr.team_class").each((_, row) => {
    const $row = $(row);
    
    let dateStr = "";
    let timeStr = "";
    
    $row.find("td").each((_, cell) => {
      const text = $(cell).text().trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        dateStr = text;
      } else if (/^\d{2}:\d{2}$/.test(text)) {
        timeStr = text;
      }
    });

    if (!dateStr) return; // Skip if no valid date found

    const datetimeIso = buildMadridDateTimeIso(dateStr, timeStr);

    // Teams
    const $teamCells = $row.find(".nombre_junto_logo");
    if ($teamCells.length < 2) return; // Skip if teams are missing

    const localTeamRaw = $teamCells.eq(0).text().trim();
    const visitorTeamRaw = $teamCells.eq(1).text().trim();

    const localTeam = normalizeTeamName(localTeamRaw);
    const visitorTeam = normalizeTeamName(visitorTeamRaw);

    // Location (we might not have a clean location in this view, usually need match details)
    // Sidgad sometimes puts venue info, but if missing we leave empty or null
    const location = ""; 

    // Score
    const scoreRaw = $row.find("td.web_link_td").text().trim();

    // Match ID
    const matchUrl = $row.find("i.game_report").parent("a").attr("href") || "";
    let matchId = "";
    const idpMatch = matchUrl.match(/idp=(\d+)/);
    if (idpMatch) {
      matchId = idpMatch[1];
    } else {
      matchId = `rfep-${leagueId}-${localTeam}-${visitorTeam}-${dateStr}`.replace(/\s+/g, "-");
    }

    const { isRivasLocal, isRivasVisitor, hasDoubleRivasWarning, rivasTeamName, rivasLetter } = getRivasTeamRoles(localTeam, visitorTeam);
    const isRivas = isRivasLocal || isRivasVisitor;

    const rivasTeamKey = buildRivasTeamKey(categoryKey, rivasLetter);
    const rivasTeamLabelFull = buildRivasTeamLabel(categoryLabel, rivasLetter);

    matches.push({
      id: matchId,
      date: dateStr,
      time: timeStr || null,
      datetimeIso,
      localTeam,
      visitorTeam,
      location,
      status: scoreRaw ? "FINISHED" : "SCHEDULED", // Basic heuristic
      score: scoreRaw || null,
      categoryKey,
      categoryLabel,
      isRivas,
      isRivasLocal,
      isRivasVisitor,
      hasDoubleRivasWarning,
      rivasTeamName,
      rivasTeamKey,
      rivasTeamLabelFull,
      rivasTeamLetter: rivasLetter,
      rival: isRivasLocal && !isRivasVisitor ? visitorTeam : (isRivasVisitor && !isRivasLocal ? localTeam : null),
      source: "rfep",
      competitionName: leagueName,
    });
  });

  return matches;
}
