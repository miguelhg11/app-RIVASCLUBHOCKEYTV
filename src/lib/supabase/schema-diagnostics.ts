import "server-only";

import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export type SupabaseSchemaStatus = {
  categoriesSortOrder: boolean;
  teamsLetter: boolean;
  teamsActive: boolean;
  usersPhone: boolean;
  teamStreamKeysTable: boolean;
  teamPlaylistsTable: boolean;
  federationSettingsTable: boolean;
  rfepLeaguesTable: boolean;
  seasonsTable: boolean;
  teamsSeasonId: boolean;
  broadcastsSeasonId: boolean;
  userPlaylistsSeasonId: boolean;
};

export async function getSupabaseSchemaStatus(): Promise<SupabaseSchemaStatus> {
  const supabase = getSupabaseServerClient();

  const [
    categoriesSortOrder,
    teamsLetter,
    teamsActive,
    usersPhone,
    teamStreamKeysTable,
    teamPlaylistsTable,
    federationSettingsTable,
    rfepLeaguesTable,
    seasonsTable,
    teamsSeasonId,
    broadcastsSeasonId,
    userPlaylistsSeasonId,
  ] = await Promise.all([
    probeColumn("categories", "sort_order", supabase),
    probeColumn("teams", "letter", supabase),
    probeColumn("teams", "active", supabase),
    probeColumn("users", "phone", supabase),
    probeTable("team_stream_keys", supabase),
    probeTable("team_playlists", supabase),
    probeTable("federation_settings", supabase),
    probeTable("rfep_leagues", supabase),
    probeTable("seasons", supabase),
    probeColumn("teams", "season_id", supabase),
    probeColumn("broadcasts", "season_id", supabase),
    probeColumn("user_playlists", "season_id", supabase),
  ]);

  return {
    categoriesSortOrder,
    teamsLetter,
    teamsActive,
    usersPhone,
    teamStreamKeysTable,
    teamPlaylistsTable,
    federationSettingsTable,
    rfepLeaguesTable,
    seasonsTable,
    teamsSeasonId,
    broadcastsSeasonId,
    userPlaylistsSeasonId,
  };
}

async function probeColumn(table: string, column: string, supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function probeTable(table: string, supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { error } = await supabase.from(table).select("*").limit(1);
  return !error;
}
