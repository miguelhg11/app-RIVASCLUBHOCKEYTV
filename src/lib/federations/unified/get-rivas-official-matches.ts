import { UnifiedFederationMatch } from "../shared/federation-match";
import { fetchRivasRfepMatchesNext7Days } from "../rfep/adapter";
import { fetchFmpRivasNext7DaysMatches } from "../fmp/adapter";
import { sortMatches } from "../shared/match-sorting";
import { FmpMatch } from "../fmp/types";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

const FEDERATIONS_CACHE_KEY = "federationsUnifiedCache";
const CACHE_TTL_HOURS = 24;

type UnifiedCachePayload = {
  expiresAt: string;
  generatedAt: string;
  matches: UnifiedFederationMatch[];
};

// Helper to convert FmpMatch to UnifiedFederationMatch
function adaptFmpToUnified(match: FmpMatch): UnifiedFederationMatch {
  return {
    id: match.sourceMatchId,
    source: "fmp",
    datetimeIso: match.scheduledStartIso,
    date: match.fecha,
    time: match.hora,
    localTeam: match.local || "",
    visitorTeam: match.visitante || "",
    competitionName: match.competicion,
    categoryKey: match.categoriaKey,
    categoryLabel: match.categoriaLabel,
    location: match.pista || "",
    status: match.resultado ? "FINISHED" : "SCHEDULED",
    score: match.resultado,
    isRivas: match.isRivasLocal || match.isRivasVisitante,
    isRivasLocal: match.isRivasLocal,
    isRivasVisitor: match.isRivasVisitante,
    hasDoubleRivasWarning: match.hasDoubleRivasWarning,
    rivasTeamName: match.rivasTeamName,
    rivasTeamLetter: match.rivasTeamLetter,
    rivasTeamKey: match.rivasTeamKey,
    rivasTeamLabelFull: match.rivasTeamLabelFull,
    rival: match.rival,
    rawUrl: match.sourceUrl,
    raw: match.raw,
  };
}

async function fetchAndBuildMatches(): Promise<UnifiedFederationMatch[]> {
  const [rfepMatches, fmpRawMatches] = await Promise.all([
    fetchRivasRfepMatchesNext7Days(),
    fetchFmpRivasNext7DaysMatches(),
  ]);

  const fmpMatches = fmpRawMatches.map(adaptFmpToUnified);
  const combined = [...rfepMatches, ...fmpMatches];
  combined.sort(sortMatches);
  return combined;
}

export async function getRivasOfficialMatches(
  _userEmail: string,
  _isAdmin: boolean,
  options?: { forceRefresh?: boolean },
): Promise<UnifiedFederationMatch[]> {
  const supabase = getSupabaseServerClient();
  const forceRefresh = options?.forceRefresh === true;

  try {
    if (!forceRefresh) {
      const { data } = await supabase.from("app_settings").select("value").eq("key", FEDERATIONS_CACHE_KEY).maybeSingle();
      const payload = data?.value as UnifiedCachePayload | undefined;
      const expiresAt = payload?.expiresAt ? new Date(payload.expiresAt).getTime() : 0;
      if (payload?.matches && Array.isArray(payload.matches) && expiresAt > Date.now()) {
        return payload.matches;
      }
    }

    const matches = await fetchAndBuildMatches();
    const now = Date.now();
    const cachePayload: UnifiedCachePayload = {
      generatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString(),
      matches,
    };

    await supabase
      .from("app_settings")
      .upsert({ key: FEDERATIONS_CACHE_KEY, value: cachePayload }, { onConflict: "key" });

    return matches;
  } catch (error) {
    console.error("Error fetching unified official matches:", error);
    const { data } = await supabase.from("app_settings").select("value").eq("key", FEDERATIONS_CACHE_KEY).maybeSingle();
    const payload = data?.value as UnifiedCachePayload | undefined;
    if (payload?.matches && Array.isArray(payload.matches)) {
      return payload.matches;
    }
    return [];
  }
}
