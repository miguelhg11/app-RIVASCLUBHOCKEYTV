import "server-only";

import { requireSession } from "@/src/lib/auth/guards";
import { ROLES } from "@/src/lib/auth/roles";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { getSelectedSeason } from "../seasons/utils";

const OCCUPIED_STATUSES = ["created", "ready", "testing", "live", "unknown"] as const;

export type AssignedTeam = {
  id: string;
  name: string;
};

export type AssignedStreamKey = {
  id: string;
  name: string;
};

export type BlockedStreamKey = {
  id: string;
  name: string;
  reason: string;
};

export type AssignedPlaylist = {
  id: string;
  name: string;
};

export async function getAssignedResourcesForCurrentUser() {
  const session = await requireSession();
  if (session.role === ROLES.admin) {
    return getAllActiveResources();
  }

  return getAssignedResourcesByUserId(session.userId);
}

export async function getBroadcastFormResourcesForCurrentUser() {
  const session = await requireSession();
  if (session.role === ROLES.admin) {
    const all = await getAllActiveResources();
    return { ...all, isAdmin: true };
  }

  const assigned = await getAssignedResourcesByUserId(session.userId);
  return { ...assigned, isAdmin: false };
}

async function getAssignedResourcesByUserId(userId: string) {
  const supabase = getSupabaseServerClient();
  const season = await getSelectedSeason();

  const [teamsRes, teamStreamKeysRes, playlistsRes] = await Promise.all([
    supabase
      .from("user_teams")
      .select("teams!inner(id,name,season_id)")
      .eq("user_id", userId)
      .eq("teams.season_id", season.id),
    supabase
      .from("user_teams")
      .select("teams!inner(id,name,season_id,team_stream_keys(stream_keys(id,name,active)))")
      .eq("user_id", userId)
      .eq("teams.season_id", season.id),
    supabase
      .from("user_teams")
      .select("teams!inner(id,name,season_id,team_playlists(playlists(id,name,active)))")
      .eq("user_id", userId)
      .eq("teams.season_id", season.id),
  ]);

  const teams: AssignedTeam[] = ((teamsRes.data ?? []) as { teams: { id: string; name: string } | { id: string; name: string }[] | null }[])
    .flatMap((row) => normalizeRelation(row.teams))
    .map((team) => ({ id: team.id, name: team.name }));

  const streamKeysMap = new Map<string, AssignedStreamKey>();
  for (const row of ((teamStreamKeysRes.data ?? []) as unknown[])) {
    const record = row as {
      teams?: Array<{
        team_stream_keys?: Array<{
          stream_keys?:
            | { id?: string; name?: string; active?: boolean }
            | Array<{ id?: string; name?: string; active?: boolean }>
            | null;
        }> | null;
      }>;
    };
    const teamsWithLinks = Array.isArray(record.teams) ? record.teams : [];
    for (const team of teamsWithLinks) {
      const links = team.team_stream_keys ?? [];
      for (const link of links) {
        const streamKeys = Array.isArray(link.stream_keys) ? link.stream_keys : link.stream_keys ? [link.stream_keys] : [];
        for (const streamKey of streamKeys) {
          if (streamKey?.id && streamKey.name && streamKey.active) {
            streamKeysMap.set(streamKey.id, { id: streamKey.id, name: streamKey.name });
          }
        }
      }
    }
  }
  const streamKeys: AssignedStreamKey[] = Array.from(streamKeysMap.values());
  const availability = await getStreamKeyAvailability(supabase, streamKeys.map((item) => item.id));
  const availableStreamKeyIds = availability.availableIds;
  const availableStreamKeys = streamKeys.filter((item) => availableStreamKeyIds.has(item.id));
  const blockedStreamKeys: BlockedStreamKey[] = streamKeys
    .filter((item) => !availableStreamKeyIds.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      reason: availability.reasonsById.get(item.id) ?? "Ocupada por programacion pendiente o activa.",
    }));

  const playlistsMap = new Map<string, AssignedPlaylist>();
  for (const row of ((playlistsRes.data ?? []) as unknown[])) {
    const record = row as {
      teams?: Array<{
        team_playlists?: Array<{
          playlists?:
            | { id?: string; name?: string; active?: boolean }
            | Array<{ id?: string; name?: string; active?: boolean }>
            | null;
        }> | null;
      }>;
    };
    const teamsWithLinks = Array.isArray(record.teams) ? record.teams : [];
    for (const team of teamsWithLinks) {
      const links = team.team_playlists ?? [];
      for (const link of links) {
        const playlistsArray = Array.isArray(link.playlists) ? link.playlists : link.playlists ? [link.playlists] : [];
        for (const playlist of playlistsArray) {
          if (playlist?.id && playlist.name && playlist.active) {
            playlistsMap.set(playlist.id, { id: playlist.id, name: playlist.name });
          }
        }
      }
    }
  }
  const playlists: AssignedPlaylist[] = Array.from(playlistsMap.values());

  return { teams, streamKeys: availableStreamKeys, streamKeysBlocked: blockedStreamKeys, playlists };
}

async function getAllActiveResources() {
  const supabase = getSupabaseServerClient();
  const season = await getSelectedSeason();

  const [teamsRes, streamKeysRes, playlistsRes] = await Promise.all([
    supabase.from("teams").select("id,name").eq("season_id", season.id).order("name", { ascending: true }),
    supabase.from("stream_keys").select("id,name").eq("active", true).order("name", { ascending: true }),
    supabase.from("playlists").select("id,name").eq("active", true).order("name", { ascending: true }),
  ]);

  const teams = (teamsRes.data ?? []) as AssignedTeam[];
  const streamKeys = (streamKeysRes.data ?? []) as AssignedStreamKey[];
  const availability = await getStreamKeyAvailability(supabase, streamKeys.map((item) => item.id));
  const availableStreamKeyIds = availability.availableIds;
  const availableStreamKeys = streamKeys.filter((item) => availableStreamKeyIds.has(item.id));
  const blockedStreamKeys: BlockedStreamKey[] = streamKeys
    .filter((item) => !availableStreamKeyIds.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      reason: availability.reasonsById.get(item.id) ?? "Ocupada por programacion pendiente o activa.",
    }));
  const playlists = (playlistsRes.data ?? []) as AssignedPlaylist[];

  return { teams, streamKeys: availableStreamKeys, streamKeysBlocked: blockedStreamKeys, playlists };
}

export async function assertCurrentUserHasAssignedResources(input: {
  teamId: string;
  streamKeyId: string;
  playlistId: string;
}) {
  const session = await requireSession();
  if (session.role === ROLES.admin) {
    return;
  }

  const assigned = await getAssignedResourcesForCurrentUser();

  const hasTeam = assigned.teams.some((team) => team.id === input.teamId);
  const hasStreamKey = assigned.streamKeys.some((streamKey) => streamKey.id === input.streamKeyId);
  const hasPlaylist = assigned.playlists.some((playlist) => playlist.id === input.playlistId);

  if (!hasTeam || !hasStreamKey || !hasPlaylist) {
    throw new Error("No tienes permisos para uno o mas recursos seleccionados.");
  }
}

function normalizeRelation<T>(value: T | T[] | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function getStreamKeyAvailability(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  candidateKeyIds: string[],
) {
  if (candidateKeyIds.length === 0) {
    return { availableIds: new Set<string>(), reasonsById: new Map<string, string>() };
  }

  const [{ data: streamRows }, { data: occupiedLocalRows }, { data: occupiedExternalRows }] = await Promise.all([
    supabase.from("stream_keys").select("id,youtube_live_stream_id").in("id", candidateKeyIds),
    supabase
      .from("broadcasts")
      .select("stream_key_id,title,scheduled_start,youtube_life_cycle_status")
      .is("deleted_at", null)
      .in("stream_key_id", candidateKeyIds)
      .in("youtube_life_cycle_status", [...OCCUPIED_STATUSES]),
    supabase
      .from("youtube_external_broadcasts")
      .select("youtube_bound_stream_id,title,scheduled_start,youtube_life_cycle_status")
      .in("youtube_life_cycle_status", [...OCCUPIED_STATUSES]),
  ]);

  const youtubeStreamIdByKeyId = new Map<string, string>();
  for (const row of (streamRows ?? []) as Array<{ id: string; youtube_live_stream_id: string }>) {
    youtubeStreamIdByKeyId.set(row.id, row.youtube_live_stream_id);
  }

  const occupiedLocal = new Set<string>();
  const reasonsById = new Map<string, string>();
  for (const row of ((occupiedLocalRows ?? []) as Array<{
    stream_key_id: string;
    title: string | null;
    scheduled_start: string | null;
    youtube_life_cycle_status: string | null;
  }>)) {
    occupiedLocal.add(row.stream_key_id);
    if (!reasonsById.has(row.stream_key_id)) {
      const dt = row.scheduled_start ? new Date(row.scheduled_start).toLocaleString("es-ES") : "fecha desconocida";
      const status = row.youtube_life_cycle_status ?? "unknown";
      const title = row.title ?? "emision local";
      reasonsById.set(row.stream_key_id, `Ocupada por ${title} (${status}, ${dt}).`);
    }
  }

  const occupiedExternalByStreamId = new Map<string, string>();
  for (const row of ((occupiedExternalRows ?? []) as Array<{
    youtube_bound_stream_id: string | null;
    title: string | null;
    scheduled_start: string | null;
    youtube_life_cycle_status: string | null;
  }>)) {
    if (!row.youtube_bound_stream_id) continue;
    if (occupiedExternalByStreamId.has(row.youtube_bound_stream_id)) continue;
    const dt = row.scheduled_start ? new Date(row.scheduled_start).toLocaleString("es-ES") : "fecha desconocida";
    const status = row.youtube_life_cycle_status ?? "unknown";
    const title = row.title ?? "emision externa";
    occupiedExternalByStreamId.set(row.youtube_bound_stream_id, `Ocupada por ${title} (YouTube Studio, ${status}, ${dt}).`);
  }

  const available = new Set<string>();
  for (const keyId of candidateKeyIds) {
    if (occupiedLocal.has(keyId)) continue;
    const youtubeStreamId = youtubeStreamIdByKeyId.get(keyId);
    if (youtubeStreamId && occupiedExternalByStreamId.has(youtubeStreamId)) {
      reasonsById.set(keyId, occupiedExternalByStreamId.get(youtubeStreamId) ?? "Ocupada por emision externa.");
      continue;
    }
    available.add(keyId);
  }

  return { availableIds: available, reasonsById };
}

export async function getTeamResourcesMap(): Promise<Record<string, { streamKeys: string[]; playlists: string[] }>> {
  const supabase = getSupabaseServerClient();
  const season = await getSelectedSeason();
  
  const [{ data: keysData }, playlistsDataRes] = await Promise.all([
    supabase
      .from("team_stream_keys")
      .select("team_id, stream_key_id, teams!inner(season_id)")
      .eq("teams.season_id", season.id),
    (async () => {
      try {
        const { data, error } = await supabase
          .from("team_playlists")
          .select("team_id, playlist_id, teams!inner(season_id)")
          .eq("teams.season_id", season.id);
        if (!error && data) return data;
      } catch {
        // no-op
      }
      return [];
    })(),
  ]);

  const map: Record<string, { streamKeys: string[]; playlists: string[] }> = {};
  
  for (const row of (keysData ?? []) as Array<{ team_id: string; stream_key_id: string }>) {
    if (!map[row.team_id]) {
      map[row.team_id] = { streamKeys: [], playlists: [] };
    }
    map[row.team_id].streamKeys.push(row.stream_key_id);
  }

  for (const row of (playlistsDataRes ?? []) as Array<{ team_id: string; playlist_id: string }>) {
    if (!map[row.team_id]) {
      map[row.team_id] = { streamKeys: [], playlists: [] };
    }
    map[row.team_id].playlists.push(row.playlist_id);
  }

  return map;
}

export async function listMySeasons(): Promise<Array<{ id: string; name: string }>> {
  const session = await requireSession();
  const supabase = getSupabaseServerClient();

  // Active status check
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("active")
    .eq("id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (userErr || !userRow || !userRow.active) {
    return [];
  }

  // Seasons where user has at least one team linked in user_teams (applies to both users and admins)
  const { data: utRows, error: utErr } = await supabase
    .from("user_teams")
    .select("team_id")
    .eq("user_id", session.userId);

  if (utErr || !utRows || utRows.length === 0) {
    return [];
  }

  const teamIds = utRows.map((r) => r.team_id);
  const { data: teamRows, error: teamErr } = await supabase
    .from("teams")
    .select("season_id")
    .in("id", teamIds);

  if (teamErr || !teamRows) {
    return [];
  }

  const seasonIds = Array.from(new Set(teamRows.map((r) => r.season_id).filter(Boolean)));
  if (seasonIds.length === 0) {
    return [];
  }

  const { data: seasonRows, error: seasonErr } = await supabase
    .from("seasons")
    .select("id, name, start_year")
    .in("id", seasonIds)
    .order("start_year", { ascending: false });

  if (seasonErr || !seasonRows) {
    return [];
  }

  return seasonRows;
}

export async function listMyFinishedEvents(seasonId: string): Promise<Array<{
  id: string;
  title: string;
  scheduledStart: string;
  youtubeWatchUrl: string | null;
  teamName: string;
}>> {
  const session = await requireSession();
  const supabase = getSupabaseServerClient();

  // Active status check
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("active")
    .eq("id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (userErr || !userRow || !userRow.active) {
    return [];
  }

  // Completed events of teams assigned to the user in user_teams for this season (applies to both users and admins)
  const { data: utRows, error: utErr } = await supabase
    .from("user_teams")
    .select("team_id")
    .eq("user_id", session.userId);

  if (utErr || !utRows || utRows.length === 0) {
    return [];
  }

  const teamIds = utRows.map((r) => r.team_id);
  const { data, error } = await supabase
    .from("broadcasts")
    .select("id, title, scheduled_start, youtube_watch_url, teams(name)")
    .eq("season_id", seasonId)
    .in("team_id", teamIds)
    .eq("youtube_life_cycle_status", "complete")
    .is("deleted_at", null)
    .order("scheduled_start", { ascending: false });

  if (error) {
    console.error("Failed to query finished events:", error.message);
    return [];
  }

  const list = (data ?? []) as any[];
  return list.map((row) => {
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    return {
      id: row.id,
      title: row.title,
      scheduledStart: row.scheduled_start,
      youtubeWatchUrl: row.youtube_watch_url,
      teamName: team?.name || "-",
    };
  });
}
