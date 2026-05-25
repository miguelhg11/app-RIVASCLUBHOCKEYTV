import { UnifiedFederationMatch } from "../shared/federation-match";
import { RFEP_LEAGUES } from "./rfep-leagues.config";
import { parseRfepCalendarHtml } from "./parser";
import { isDateInNext7Days } from "../shared/date-range";
import { getRfepLeaguesConfig } from "@/src/lib/federations/settings";

const RFEP_BASE_URL = "https://www.server2.sidgad.es/rfep";

export async function fetchRfepMatches(): Promise<UnifiedFederationMatch[]> {
  const allMatches: UnifiedFederationMatch[] = [];
  const leagueRows = await getRfepLeaguesConfig();
  const activeLeagues = leagueRows.length > 0
    ? leagueRows.filter((league) => league.active).map((league) => ({
        leagueId: league.leagueId,
        categoryLabel: league.name,
      }))
    : RFEP_LEAGUES.map((league) => ({ leagueId: league.leagueId, categoryLabel: league.categoryLabel }));

  for (const league of activeLeagues) {
    try {
      const url = `${RFEP_BASE_URL}/rfep_cal_idc_${league.leagueId}_1.php`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "text/html",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.hockeypatines.fep.es/",
          "Origin": "https://www.hockeypatines.fep.es"
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch RFEP calendar for league ${league.leagueId}: ${response.statusText}`);
        continue;
      }

      const html = await response.text();
      const leagueMatches = parseRfepCalendarHtml(html, league.leagueId, league.categoryLabel);
      
      allMatches.push(...leagueMatches);
    } catch (error) {
      console.error(`Error fetching RFEP calendar for league ${league.leagueId}:`, error);
    }
  }

  return allMatches;
}

export async function fetchRivasRfepMatchesNext7Days(): Promise<UnifiedFederationMatch[]> {
  const matches = await fetchRfepMatches();
  
  return matches.filter(match => {
    // Only keep Rivas matches
    if (!match.isRivas) return false;

    // Only keep matches in the next 7 days
    if (!match.datetimeIso || !isDateInNext7Days(match.datetimeIso)) {
      return false;
    }

    return true;
  });
}
