import "server-only";

import { requireAdmin } from "@/src/lib/auth/guards";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { getSelectedSeason } from "../seasons/utils";

const DEFAULT_CATEGORIES: Array<{ name: string; sort_order: number }> = [
  { name: "Micro XS", sort_order: 1 },
  { name: "Prebenjamín XS", sort_order: 2 },
  { name: "Prebenjamín", sort_order: 3 },
  { name: "Benjamín", sort_order: 4 },
  { name: "Alevín", sort_order: 5 },
  { name: "Infantil", sort_order: 6 },
  { name: "Juvenil", sort_order: 7 },
  { name: "Junior", sort_order: 8 },
  { name: "Sub15 Femenino", sort_order: 9 },
  { name: "Sub17 Femenino", sort_order: 10 },
  { name: "1ª Autonómica Masculina", sort_order: 11 },
  { name: "1ª Autonómica Femenina", sort_order: 12 },
  { name: "OK Liga Masculina", sort_order: 13 },
  { name: "OK Liga Plata Masculina Sur", sort_order: 14 },
  { name: "OK Liga Plata Femenina", sort_order: 15 },
  { name: "OK Liga Bronce Masculina Sur", sort_order: 16 },
];

export type CategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type TeamRow = {
  id: string;
  name: string;
  display_name: string | null;
  federation_scope: "fmp" | "rfep" | "manual";
  federation_team_name: string | null;
  letter: "A" | "B" | "C" | "D" | null;
  active: boolean;
  category_id: string;
  categories: { name: string; sort_order: number }[] | null;
  team_stream_keys?: { stream_key_id: string }[] | null;
  team_playlists?: { playlist_id: string }[] | null;
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "user";
  active: boolean;
};

export type StreamKeyRow = {
  id: string;
  name: string;
  youtube_live_stream_id: string;
  stream_key: string;
  rtmp_url: string;
  active: boolean;
};

export type PlaylistRow = {
  id: string;
  name: string;
  youtube_playlist_id: string;
  description: string | null;
  active: boolean;
};

export type ThumbnailBackgroundRow = {
  id: string;
  name: string;
  url_path: string;
  active: boolean;
  base64_data?: string | null;
  is_default?: boolean;
};

export type UserAssignmentsMap = Record<
  string,
  {
    teamIds: string[];
    teamNames: string[];
  }
>;

export type TeamStreamKeyAssignmentsMap = Record<string, string[]>;

export async function listCategories(): Promise<CategoryRow[]> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  await ensureDefaultCategories();
  const { data } = await supabase
    .from("categories")
    .select("id,name,sort_order,created_at")
    .order("sort_order", { ascending: true });
  return (data ?? []) as CategoryRow[];
}

export async function listTeams(): Promise<TeamRow[]> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  await ensureDefaultCategories();

  const season = await getSelectedSeason();

  // Comprobar si team_playlists existe para avoid roturas
  const { error: testError } = await supabase.from("team_playlists").select("playlist_id").limit(1);
  const hasTeamPlaylists = !testError;

  const selectFields = hasTeamPlaylists
    ? "id,name,display_name,federation_scope,federation_team_name,letter,active,category_id,categories(name,sort_order),team_stream_keys(stream_key_id),team_playlists(playlist_id)"
    : "id,name,display_name,federation_scope,federation_team_name,letter,active,category_id,categories(name,sort_order),team_stream_keys(stream_key_id)";

  const { data } = await supabase
    .from("teams")
    .select(selectFields)
    .eq("season_id", season.id)
    .order("category_id", { ascending: true })
    .order("letter", { ascending: true });

  const rows = (data ?? []) as any[];
  return rows.map((row) => ({
    ...row,
    team_stream_keys: row.team_stream_keys || [],
    team_playlists: row.team_playlists || [],
  })) as TeamRow[];
}

async function ensureDefaultCategories() {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase.from("categories").select("id,name");
  const rows = existing ?? [];

  // Global dedupe by normalized name (not only defaults).
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    const current = grouped.get(key) ?? [];
    current.push(row.id);
    grouped.set(key, current);
  }

  for (const ids of grouped.values()) {
    if (ids.length <= 1) continue;
    const keeperId = ids[0];
    const duplicates = ids.slice(1);
    for (const duplicateId of duplicates) {
      await supabase.from("teams").update({ category_id: keeperId }).eq("category_id", duplicateId);
      await supabase.from("categories").delete().eq("id", duplicateId);
    }
  }

  const { data: afterDedupe } = await supabase.from("categories").select("id,name");
  const cleanRows = afterDedupe ?? [];

  for (const row of DEFAULT_CATEGORIES) {
    const matches = cleanRows.filter((item) => normalizeName(item.name) === normalizeName(row.name));
    const match = matches[0];
    if (match?.id) {
      await supabase.from("categories").update({ name: row.name, sort_order: row.sort_order }).eq("id", match.id);

      continue;
    }
    await supabase.from("categories").insert(row);
  }

  await supabase
    .from("app_settings")
    .upsert({ key: "defaultCategoriesSeeded", value: true }, { onConflict: "key" });
}

function normalizeName(value: string) {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ª/g, "A")
    .replace(/º/g, "O")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function listUsers(): Promise<UserRow[]> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("id,name,email,phone,role,active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as UserRow[];
}

export async function listStreamKeys(): Promise<StreamKeyRow[]> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("stream_keys")
    .select("id,name,youtube_live_stream_id,stream_key,rtmp_url,active")
    .order("created_at", { ascending: false });
  return (data ?? []) as StreamKeyRow[];
}

export async function listPlaylists(): Promise<PlaylistRow[]> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("playlists")
    .select("id,name,youtube_playlist_id,description,active")
    .order("created_at", { ascending: false });
  return (data ?? []) as PlaylistRow[];
}

export async function listThumbnailBackgrounds(): Promise<ThumbnailBackgroundRow[]> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("thumbnail_backgrounds")
    .select("id,name,url_path,active,base64_data,is_default")
    .order("created_at", { ascending: false });
  return (data ?? []) as ThumbnailBackgroundRow[];
}

export async function listUserAssignmentsMap(): Promise<UserAssignmentsMap> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();

  const season = await getSelectedSeason();

  const { data } = await supabase
    .from("user_teams")
    .select("user_id,teams!inner(id,name,season_id)")
    .eq("teams.season_id", season.id);

  const map: UserAssignmentsMap = {};

  const ensure = (userId: string) => {
    if (!map[userId]) {
      map[userId] = { teamIds: [], teamNames: [] };
    }
    return map[userId];
  };

  for (const row of (data ?? []) as { user_id: string; teams: { id: string; name: string } | { id: string; name: string }[] | null }[]) {
    const bucket = ensure(row.user_id);
    const items = Array.isArray(row.teams) ? row.teams : row.teams ? [row.teams] : [];
    for (const item of items) {
      bucket.teamIds.push(item.id);
      bucket.teamNames.push(item.name);
    }
  }

  return map;
}

export async function listTeamStreamKeyAssignmentsMap(): Promise<TeamStreamKeyAssignmentsMap> {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const season = await getSelectedSeason();

  const { data } = await supabase
    .from("team_stream_keys")
    .select("stream_key_id,teams!inner(name,season_id)")
    .eq("teams.season_id", season.id);
  const map: TeamStreamKeyAssignmentsMap = {};
  for (const row of (data ?? []) as { stream_key_id: string; teams: { name: string } | { name: string }[] | null }[]) {
    const items = Array.isArray(row.teams) ? row.teams : row.teams ? [row.teams] : [];
    if (!map[row.stream_key_id]) map[row.stream_key_id] = [];
    for (const item of items) map[row.stream_key_id].push(item.name);
  }
  return map;
}
