import "server-only";

import { requireSession } from "@/src/lib/auth/guards";
import { ROLES } from "@/src/lib/auth/roles";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export async function autoSyncBroadcastStatuses() {
  const supabase = getSupabaseServerClient();

  // 1. Find all active broadcasts (not deleted, and status is not complete)
  const { data: activeBroadcasts, error } = await supabase
    .from("broadcasts")
    .select("id, youtube_broadcast_id, youtube_life_cycle_status, last_youtube_sync_at")
    .is("deleted_at", null)
    .neq("youtube_life_cycle_status", "complete")
    .limit(50); // limit to protect performance

  if (error || !activeBroadcasts || activeBroadcasts.length === 0) {
    return;
  }

  // 2. Filter those that have not been synced in the last 30 seconds (cooldown)
  const now = new Date();
  const listToSync = activeBroadcasts.filter((bc) => {
    if (!bc.youtube_broadcast_id) return false;
    if (!bc.last_youtube_sync_at) return true;
    const lastSync = new Date(bc.last_youtube_sync_at);
    return now.getTime() - lastSync.getTime() > 30000; // 30 seconds cooldown
  });

  if (listToSync.length === 0) {
    return;
  }

  const ids = listToSync.map((bc) => bc.youtube_broadcast_id) as string[];

  try {
    const { getYouTubeBroadcastStatuses } = await import("@/src/lib/youtube/service");
    const statuses = await getYouTubeBroadcastStatuses(ids);

    const nowIso = now.toISOString();

    for (const bc of listToSync) {
      const youtubeId = bc.youtube_broadcast_id!;
      const remote = statuses[youtubeId];

      if (remote) {
        const statusChanged = remote.lifeCycleStatus !== bc.youtube_life_cycle_status;
        const updatePayload: any = {
          youtube_life_cycle_status: remote.lifeCycleStatus,
          last_youtube_sync_at: nowIso,
          youtube_sync_status: "synced",
          youtube_last_error: null,
        };

        if (remote.actualStart) updatePayload.actual_start_time = remote.actualStart;
        if (remote.actualEnd) updatePayload.actual_end_time = remote.actualEnd;

        if (remote.lifeCycleStatus === "complete") {
          updatePayload.ended_at = nowIso;
          updatePayload.ended_by = "system_auto_sync";
        }

        await supabase
          .from("broadcasts")
          .update(updatePayload)
          .eq("id", bc.id);

        if (statusChanged) {
          console.log(`Auto-synchronized status for broadcast ${bc.id}: ${bc.youtube_life_cycle_status} -> ${remote.lifeCycleStatus}`);
        }
      } else {
        // Not found on YouTube: could be deleted. Soft-delete locally to match YouTube Studio.
        console.log(`Broadcast ${bc.id} (${youtubeId}) not found on YouTube. Soft-deleting.`);
        await supabase
          .from("broadcasts")
          .update({
            deleted_at: nowIso,
            youtube_life_cycle_status: "complete",
            youtube_sync_status: "synced",
            youtube_last_error: "Eliminado o cancelado desde YouTube Studio.",
            last_youtube_sync_at: nowIso,
          })
          .eq("id", bc.id);
      }
    }
  } catch (err) {
    console.error("Failed to auto-sync broadcast statuses:", err);
  }
}

export async function getBroadcastForSuccessPage(id: string) {
  const session = await requireSession();
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("broadcasts")
    .select("id,created_by,title,youtube_watch_url,youtube_video_id,thumbnail_status,youtube_sync_status,stream_keys(rtmp_url,stream_key)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (session.role !== ROLES.admin && data.created_by !== session.userId) {
    return null;
  }

  return data;
}

export async function listMyBroadcasts() {
  const session = await requireSession();
  await autoSyncBroadcastStatuses().catch((err) => console.error(err));
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from("broadcasts")
    .select("id,title,scheduled_start,youtube_watch_url,youtube_share_url,youtube_sync_status,youtube_life_cycle_status,created_by")
    .is("deleted_at", null)
    .eq("created_by", session.userId)
    .order("scheduled_start", { ascending: false })
    .limit(100);

  const list = data ?? [];
  const nowMs = Date.now();
  const liveStatuses = new Set(["live", "testing"]);

  return list.filter((bc) => {
    if (bc.youtube_life_cycle_status === "complete") return false;
    const status = (bc.youtube_life_cycle_status ?? "").toLowerCase();
    if (liveStatuses.has(status)) return false;
    const scheduledMs = new Date(bc.scheduled_start).getTime();
    if (!Number.isFinite(scheduledMs)) return true;
    return scheduledMs >= nowMs;
  });
}

export type LiveBroadcastRow = {
  id: string;
  title: string;
  scheduledStart: string;
  youtubeLifeCycleStatus: string;
  youtubeSyncStatus: string;
  youtubeWatchUrl: string | null;
  youtubeShareUrl: string | null;
  createdBy: string;
};

export async function listLiveBroadcastsForSession(scope: "personal" | "global" = "personal"): Promise<LiveBroadcastRow[]> {
  const session = await requireSession();
  await autoSyncBroadcastStatuses().catch((err) => console.error(err));
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("broadcasts")
    .select("id,title,scheduled_start,youtube_life_cycle_status,youtube_sync_status,youtube_watch_url,youtube_share_url,created_by")
    .is("deleted_at", null)
    .eq("youtube_life_cycle_status", "live")
    .order("scheduled_start", { ascending: true })
    .limit(100);

  const globalAllowed = scope === "global" && session.role === ROLES.admin;
  if (!globalAllowed) {
    query = query.eq("created_by", session.userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to query live broadcasts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    scheduledStart: row.scheduled_start,
    youtubeLifeCycleStatus: row.youtube_life_cycle_status ?? "unknown",
    youtubeSyncStatus: row.youtube_sync_status ?? "unknown",
    youtubeWatchUrl: row.youtube_watch_url,
    youtubeShareUrl: row.youtube_share_url,
    createdBy: row.created_by,
  }));
}

export async function countLiveBroadcastsForSession(scope: "personal" | "global" = "personal"): Promise<number> {
  const session = await requireSession().catch(() => null);
  if (!session) return 0;
  await autoSyncBroadcastStatuses().catch((err) => console.error(err));

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("broadcasts")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("youtube_life_cycle_status", "live");

  const globalAllowed = scope === "global" && session.role === ROLES.admin;
  if (!globalAllowed) {
    query = query.eq("created_by", session.userId);
  }

  const { count, error } = await query;
  if (error) {
    console.error("Failed to count live broadcasts:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function listAllBroadcastsAdmin() {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("broadcasts")
    .select("id,title,scheduled_start,youtube_watch_url,youtube_sync_status,youtube_broadcast_id,created_by")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  return data ?? [];
}

export type AdminBroadcastOverviewRow = {
  source: "app" | "youtube_external";
  id: string;
  title: string;
  scheduledStart: string;
  lifeCycleStatus: string;
  syncStatus: string;
  watchUrl: string | null;
  shareUrl: string | null;
  youtubeBroadcastId: string | null;
  streamLabel: string;
  streamOccupied: boolean;
};

const OCCUPIED_STATUSES = new Set(["created", "ready", "testing", "live", "unknown"]);

export async function listAdminBroadcastOverview(): Promise<AdminBroadcastOverviewRow[]> {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    return [];
  }
  await autoSyncBroadcastStatuses().catch((err) => console.error(err));

  const supabase = getSupabaseServerClient();

  const [localsRes, externalRes, streamKeysRes] = await Promise.all([
    supabase
      .from("broadcasts")
      .select("id,title,scheduled_start,youtube_life_cycle_status,youtube_sync_status,youtube_watch_url,youtube_share_url,youtube_broadcast_id,youtube_bound_stream_id,stream_keys(name,youtube_live_stream_id)")
      .is("deleted_at", null)
      .order("scheduled_start", { ascending: true })
      .limit(300),
    supabase
      .from("youtube_external_broadcasts")
      .select("id,title,scheduled_start,youtube_life_cycle_status,youtube_watch_url,youtube_share_url,youtube_broadcast_id,youtube_bound_stream_id")
      .order("scheduled_start", { ascending: true })
      .limit(300),
    supabase.from("stream_keys").select("name,youtube_live_stream_id"),
  ]);

  const streamNameByYoutubeId = new Map<string, string>();
  for (const row of (streamKeysRes.data ?? []) as Array<{ name: string; youtube_live_stream_id: string }>) {
    streamNameByYoutubeId.set(row.youtube_live_stream_id, row.name);
  }

  const localRows: AdminBroadcastOverviewRow[] = ((localsRes.data ?? []) as Array<{
    id: string;
    title: string;
    scheduled_start: string;
    youtube_life_cycle_status: string | null;
    youtube_sync_status: string | null;
    youtube_watch_url: string | null;
    youtube_share_url: string | null;
    youtube_broadcast_id: string | null;
    youtube_bound_stream_id: string | null;
    stream_keys: { name?: string; youtube_live_stream_id?: string } | { name?: string; youtube_live_stream_id?: string }[] | null;
  }>).map((row) => {
    const stream = Array.isArray(row.stream_keys) ? row.stream_keys[0] : row.stream_keys;
    const status = row.youtube_life_cycle_status ?? "unknown";
    return {
      source: "app",
      id: row.id,
      title: row.title,
      scheduledStart: row.scheduled_start,
      lifeCycleStatus: status,
      syncStatus: row.youtube_sync_status ?? "unknown",
      watchUrl: row.youtube_watch_url,
      shareUrl: row.youtube_share_url,
      youtubeBroadcastId: row.youtube_broadcast_id,
      streamLabel: stream?.name || "-",
      streamOccupied: OCCUPIED_STATUSES.has(status),
    };
  });

  const externalRows: AdminBroadcastOverviewRow[] = ((externalRes.data ?? []) as Array<{
    id: string;
    title: string;
    scheduled_start: string | null;
    youtube_life_cycle_status: string | null;
    youtube_watch_url: string | null;
    youtube_share_url: string | null;
    youtube_broadcast_id: string | null;
    youtube_bound_stream_id: string | null;
  }>).map((row) => {
    const status = row.youtube_life_cycle_status ?? "unknown";
    const streamName = row.youtube_bound_stream_id
      ? streamNameByYoutubeId.get(row.youtube_bound_stream_id)
      : undefined;
    return {
      source: "youtube_external",
      id: row.id,
      title: row.title,
      scheduledStart: row.scheduled_start ?? new Date().toISOString(),
      lifeCycleStatus: status,
      syncStatus: "synced",
      watchUrl: row.youtube_watch_url,
      shareUrl: row.youtube_share_url,
      youtubeBroadcastId: row.youtube_broadcast_id,
      streamLabel: streamName || (row.youtube_bound_stream_id ? `Stream ${row.youtube_bound_stream_id.slice(0, 8)}` : "-"),
      streamOccupied: OCCUPIED_STATUSES.has(status),
    };
  });

  return [...localRows, ...externalRows].sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}

export type PendingBroadcastAdminRow = {
  id: string;
  title: string;
  scheduledStart: string;
  youtubeLifeCycleStatus: string;
  youtubeSyncStatus: string;
  youtubeWatchUrl: string | null;
  youtubeShareUrl: string | null;
  youtubeBroadcastId: string | null;
  createdBy: string;
  creatorName: string | null;
  creatorEmail: string | null;
  teamId: string;
  teamName: string;
  teamDisplayName: string | null;
};

export async function listPendingBroadcastsAdmin(): Promise<PendingBroadcastAdminRow[]> {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    return [];
  }
  await autoSyncBroadcastStatuses().catch((err) => console.error(err));

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("broadcasts")
    .select(`
      id,
      title,
      scheduled_start,
      youtube_life_cycle_status,
      youtube_sync_status,
      youtube_watch_url,
      youtube_share_url,
      youtube_broadcast_id,
      created_by,
      users!broadcasts_created_by_fkey(name, email),
      team_id,
      teams(id, name, display_name)
    `)
    .is("deleted_at", null)
    .neq("youtube_life_cycle_status", "complete")
    .order("scheduled_start", { ascending: true });

  if (error) {
    console.error("Failed to query pending broadcasts:", error.message);
    return [];
  }

  const rows = (data ?? []) as any[];
  return rows.map((row) => {
    const creator = Array.isArray(row.users) ? row.users[0] : row.users;
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    return {
      id: row.id,
      title: row.title,
      scheduledStart: row.scheduled_start,
      youtubeLifeCycleStatus: row.youtube_life_cycle_status ?? "unknown",
      youtubeSyncStatus: row.youtube_sync_status ?? "unknown",
      youtubeWatchUrl: row.youtube_watch_url,
      youtubeShareUrl: row.youtube_share_url,
      youtubeBroadcastId: row.youtube_broadcast_id,
      createdBy: row.created_by,
      creatorName: creator?.name || null,
      creatorEmail: creator?.email || null,
      teamId: row.team_id,
      teamName: team?.name || "-",
      teamDisplayName: team?.display_name || null,
    };
  });
}

export type CachedYouTubeVideoRow = {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  publishedAt: string;
  videoType: "video" | "live" | "short";
  youtubeWatchUrl: string;
  youtubeShareUrl: string | null;
  youtubeEmbedUrl: string | null;
  playlistIds: string[];
};

export async function listCachedChannelVideosAdmin(): Promise<CachedYouTubeVideoRow[]> {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("youtube_channel_videos")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Failed to query cached videos:", error.message);
    // Return mock data fallback if table does not exist or has errors (resilience guard)
    if (process.env.YOUTUBE_MOCK_MODE === "true" || error.message.includes("does not exist")) {
      console.warn("Table youtube_channel_videos does not exist, falling back to mock data.");
      const { listYouTubeChannelVideosMock } = await import("@/src/lib/youtube/service");
      const mocks = await listYouTubeChannelVideosMock();
      return mocks.map((m, index) => ({
        id: `mock-id-${index}`,
        youtubeVideoId: m.youtubeVideoId,
        title: m.title,
        description: m.description,
        publishedAt: m.publishedAt,
        videoType: m.videoType,
        youtubeWatchUrl: m.watchUrl,
        youtubeShareUrl: m.shareUrl,
        youtubeEmbedUrl: m.embedUrl,
        playlistIds: m.playlistIds,
      }));
    }
    return [];
  }

  const rows = (data ?? []) as any[];
  return rows.map((row) => ({
    id: row.id,
    youtubeVideoId: row.youtube_video_id,
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
    videoType: row.video_type,
    youtubeWatchUrl: row.youtube_watch_url,
    youtubeShareUrl: row.youtube_share_url,
    youtubeEmbedUrl: row.youtube_embed_url,
    playlistIds: Array.isArray(row.playlist_ids) ? row.playlist_ids : [],
  }));
}

export type UnassignedExternalBroadcastRow = {
  id: string;
  youtubeBroadcastId: string;
  youtubeVideoId: string | null;
  youtubeBoundStreamId: string | null;
  title: string;
  description: string | null;
  scheduledStart: string | null;
  youtubeLifeCycleStatus: string;
  youtubeWatchUrl: string | null;
  youtubeShareUrl: string | null;
};

export async function listUnassignedExternalBroadcasts(): Promise<UnassignedExternalBroadcastRow[]> {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("youtube_external_broadcasts")
    .select("*")
    .is("matched_broadcast_id", null)
    .neq("youtube_life_cycle_status", "complete")
    .neq("youtube_life_cycle_status", "failed")
    .neq("youtube_life_cycle_status", "cancelled")
    .order("scheduled_start", { ascending: true });

  if (error) {
    console.error("Failed to list unassigned external broadcasts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    youtubeBroadcastId: row.youtube_broadcast_id,
    youtubeVideoId: row.youtube_video_id,
    youtubeBoundStreamId: row.youtube_bound_stream_id,
    title: row.title,
    description: row.description,
    scheduledStart: row.scheduled_start,
    youtubeLifeCycleStatus: row.youtube_life_cycle_status,
    youtubeWatchUrl: row.youtube_watch_url,
    youtubeShareUrl: row.youtube_share_url,
  }));
}

export async function countUnassignedExternalBroadcasts(): Promise<number> {
  const session = await requireSession().catch(() => null);
  if (!session || session.role !== ROLES.admin) {
    return 0;
  }

  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("youtube_external_broadcasts")
    .select("*", { count: "exact", head: true })
    .is("matched_broadcast_id", null)
    .neq("youtube_life_cycle_status", "complete")
    .neq("youtube_life_cycle_status", "failed")
    .neq("youtube_life_cycle_status", "cancelled");

  if (error) {
    console.error("Failed to count unassigned external broadcasts:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function getExternalBroadcastById(id: string): Promise<UnassignedExternalBroadcastRow | null> {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("youtube_external_broadcasts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    youtubeBroadcastId: data.youtube_broadcast_id,
    youtubeVideoId: data.youtube_video_id,
    youtubeBoundStreamId: data.youtube_bound_stream_id,
    title: data.title,
    description: data.description,
    scheduledStart: data.scheduled_start,
    youtubeLifeCycleStatus: data.youtube_life_cycle_status,
    youtubeWatchUrl: data.youtube_watch_url,
    youtubeShareUrl: data.youtube_share_url,
  };
}

export async function getBroadcastForEdit(id: string) {
  const session = await requireSession();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("broadcasts")
    .select(`
      id,
      title,
      description,
      scheduled_start,
      competition_name,
      home_team_name,
      away_team_name,
      home_crest_url,
      away_crest_url,
      venue,
      team_id,
      stream_key_id,
      playlist_id,
      thumbnail_background_id,
      thumbnail_payload,
      thumbnail_overrides,
      created_by,
      federation_source,
      federation_match_id
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (session.role !== ROLES.admin && data.created_by !== session.userId) {
    return null;
  }

  return data;
}
