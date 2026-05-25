import "server-only";

import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { RFEP_LEAGUES } from "@/src/lib/federations/rfep/rfep-leagues.config";

export type FederationSourceConfig = {
  source: "fmp" | "rfep";
  url: string;
  baseUrl: string;
  defaultRangeDays: number;
  clubPrimaryToken: string;
  preferredAliases: string[];
  active: boolean;
  lastStatus?: string | null;
  lastError?: string | null;
  lastCheckedAt?: string | null;
};

export type RfepLeagueSetting = {
  leagueId: number;
  name: string;
  categoryKey: string;
  url: string;
  active: boolean;
  lastStatus?: string | null;
  lastError?: string | null;
  lastCheckedAt?: string | null;
};

const DEFAULT_SOURCES: FederationSourceConfig[] = [
  {
    source: "fmp",
    url: process.env.FMP_UPCOMING_URL ?? "",
    baseUrl: process.env.FMP_UPCOMING_URL ?? "https://sidgad.cloud/shared/portales_files/agenda_portales.php",
    defaultRangeDays: 7,
    clubPrimaryToken: "RIVAS",
    preferredAliases: [process.env.FMP_CLUB_NAME ?? "CP RIVAS LAS LAGUNAS"],
    active: false,
  },
  {
    source: "rfep",
    url: process.env.RFEP_UPCOMING_URL ?? "",
    baseUrl: process.env.RFEP_UPCOMING_URL ?? "https://www.server2.sidgad.es/rfep",
    defaultRangeDays: 7,
    clubPrimaryToken: "RIVAS",
    preferredAliases: [process.env.RFEP_CLUB_NAME ?? "ADISS HOCKEY RIVAS"],
    active: false,
  },
];

export async function getFederationSourcesConfig(): Promise<FederationSourceConfig[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("federation_settings")
    .select("source,url,base_url,default_range_days,club_primary_token,preferred_aliases,is_active,last_status,last_error,last_checked_at")
    .order("source", { ascending: true });

  if (!data || data.length === 0) {
    return DEFAULT_SOURCES;
  }

  const parsed = data
    .map((item) => normalizeSource(item))
    .filter((item): item is FederationSourceConfig => Boolean(item));

  if (parsed.length === 0) {
    return DEFAULT_SOURCES;
  }

  return parsed;
}

export async function saveFederationSourcesConfig(sources: FederationSourceConfig[]) {
  const supabase = getSupabaseServerClient();
  const payload = sources.map((source) => ({
    source: source.source,
    url: source.url,
    base_url: source.baseUrl,
    default_range_days: source.defaultRangeDays,
    club_primary_token: source.clubPrimaryToken,
    preferred_aliases: source.preferredAliases,
    is_active: source.active,
  }));
  await supabase.from("federation_settings").upsert(payload, { onConflict: "source" });
}

export async function getRfepLeaguesConfig(): Promise<RfepLeagueSetting[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rfep_leagues")
    .select("league_id,name,category_key,url,is_active,last_status,last_error,last_checked_at")
    .order("league_id", { ascending: true });

  if (!data || data.length === 0) {
    return RFEP_LEAGUES.map((league) => ({
      leagueId: league.leagueId,
      name: league.nameHint,
      categoryKey: league.categoryKey,
      url: `https://www.server2.sidgad.es/rfep/rfep_cal_idc_${league.leagueId}_1.php`,
      active: true,
    }));
  }

  return data.map((row) => ({
    leagueId: row.league_id,
    name: row.name,
    categoryKey: row.category_key,
    url: row.url,
    active: row.is_active,
    lastStatus: row.last_status,
    lastError: row.last_error,
    lastCheckedAt: row.last_checked_at,
  }));
}

export async function saveRfepLeaguesConfig(leagues: RfepLeagueSetting[]) {
  const supabase = getSupabaseServerClient();
  const payload = leagues.map((league) => ({
    league_id: league.leagueId,
    name: league.name,
    category_key: league.categoryKey,
    url: league.url,
    is_active: league.active,
  }));
  await supabase.from("rfep_leagues").upsert(payload, { onConflict: "league_id" });
}

function normalizeSource(input: unknown): FederationSourceConfig | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const source = row.source;
  const url = row.url;
  const baseUrl = row.base_url;
  const defaultRangeDays = row.default_range_days;
  const clubPrimaryToken = row.club_primary_token;
  const preferredAliases = row.preferred_aliases;
  const active = row.is_active;

  if (
    (source !== "fmp" && source !== "rfep") ||
    typeof url !== "string" ||
    typeof baseUrl !== "string" ||
    typeof defaultRangeDays !== "number" ||
    typeof clubPrimaryToken !== "string"
  ) {
    return null;
  }

  return {
    source,
    url,
    baseUrl,
    defaultRangeDays,
    clubPrimaryToken,
    preferredAliases: Array.isArray(preferredAliases) ? preferredAliases.filter((x): x is string => typeof x === "string") : [],
    active: Boolean(active),
    lastStatus: typeof row.last_status === "string" ? row.last_status : null,
    lastError: typeof row.last_error === "string" ? row.last_error : null,
    lastCheckedAt: typeof row.last_checked_at === "string" ? row.last_checked_at : null,
  };
}
