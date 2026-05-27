"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/src/lib/auth/guards";
import { revalidateAllResourcePaths } from "./admin.actions";
import { getSelectedSeason } from "@/src/lib/seasons/utils";
import { sanitizeForLog } from "@/src/lib/logging/sanitize";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { assertCurrentUserHasAssignedResources } from "@/src/lib/user/queries";
import { userHasAccessToRivasTeam } from "@/src/lib/federations/unified/permissions";
import { createBroadcastSchema, updateBroadcastSchema } from "@/src/lib/validation/broadcast";
import {
  createYouTubeBroadcast,
  endYouTubeBroadcast,
  listYouTubeChannelBroadcasts,
  listYouTubeChannelPlaylists,
  listYouTubeChannelStreams,
  listYouTubeChannelVideos,
  deleteYouTubeBroadcast,
  deleteYouTubeVideo,
  updateYouTubeBroadcast,
  uploadYouTubeBroadcastThumbnail,
} from "@/src/lib/youtube/service";
import { expirePendingBroadcasts } from "@/src/lib/broadcast/expiration";

export type CreateBroadcastState = {
  error?: string;
};

export type SyncBroadcastState = {
  error?: string;
  ok?: string;
};

export type EndBroadcastState = {
  error?: string;
  ok?: string;
};

async function applyThumbnailToYouTube(videoId: string, data: any) {
  try {
    const hostList = await headers();
    const host = hostList.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const shortTitle = data.thumbnailPayload ? JSON.parse(data.thumbnailPayload).shortTitle : "";
    const competitionLine = data.thumbnailPayload ? JSON.parse(data.thumbnailPayload).competitionLine : "";
    const bottomLine = data.thumbnailPayload ? JSON.parse(data.thumbnailPayload).bottomLine : "";

    const renderUrl = `${baseUrl}/api/thumbnail/render`;
    console.log("Fetching rendered thumbnail via POST from:", renderUrl);
    const res = await fetch(renderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shortTitle,
        competitionLine,
        localName: data.homeTeamName || "",
        visitorName: data.awayTeamName || "",
        bottomLine,
        localLogo: data.homeCrestUrl || "",
        visitorLogo: data.awayCrestUrl || "",
        backgroundId: data.thumbnailBackgroundId || "",
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to render thumbnail: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Uploading thumbnail to YouTube for videoId:", videoId);
    await uploadYouTubeBroadcastThumbnail({
      videoId,
      imageBuffer: buffer,
      mimeType: "image/png",
    });
    console.log("Thumbnail applied successfully to YouTube.");
  } catch (err) {
    console.error("Error applying thumbnail to YouTube:", err);
  }
}

export async function createBroadcastAction(_prev: CreateBroadcastState, formData: FormData): Promise<CreateBroadcastState> {
  const session = await requireSession();

  const parsed = createBroadcastSchema.safeParse({
    teamId: formData.get("teamId"),
    streamKeyId: formData.get("streamKeyId"),
    playlistId: formData.get("playlistId"),
    competitionName: formData.get("competitionName"),
    homeTeamName: formData.get("homeTeamName"),
    awayTeamName: formData.get("awayTeamName"),
    homeCrestUrl: formData.get("homeCrestUrl") || undefined,
    awayCrestUrl: formData.get("awayCrestUrl") || undefined,
    venue: formData.get("venue") || undefined,
    scheduledStart: formData.get("scheduledStart"),
    description: formData.get("description") || undefined,
    confirmedLegalBasis: formData.get("confirmedLegalBasis") === "on",
    federationSource: formData.get("federationSource") || undefined,
    federationMatchId: formData.get("federationMatchId") || undefined,
    federationTeamKey: formData.get("federationTeamKey") || undefined,
    thumbnailPayload: formData.get("thumbnailPayload") || undefined,
    thumbnailOverrides: formData.get("thumbnailOverrides") || undefined,
    thumbnailBackgroundId: formData.get("thumbnailBackgroundId") || undefined,
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
    console.error("Validation error when creating broadcast:", errorDetails);
    return { error: `Datos de formulario no validos. Detalles: ${errorDetails}` };
  }

  const scheduledDate = new Date(parsed.data.scheduledStart);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { error: "Fecha/hora no valida." };
  }
  const scheduledStartIso = scheduledDate.toISOString();

  try {
    await assertCurrentUserHasAssignedResources({
      teamId: parsed.data.teamId,
      streamKeyId: parsed.data.streamKeyId,
      playlistId: parsed.data.playlistId,
    });
  } catch {
    return { error: "No tienes permisos para uno o mas recursos seleccionados." };
  }

  // Check federation team key access
  if (parsed.data.federationTeamKey) {
    const isAdmin = session.role === "admin" || (session.role as string) === "superadmin";
    const hasAccess = await userHasAccessToRivasTeam(session.email ?? "", isAdmin, parsed.data.federationTeamKey);
    if (!hasAccess) {
      return { error: "No tienes permisos para programar directos de este equipo federado." };
    }
  }

  const supabase = getSupabaseServerClient();
  const season = await getSelectedSeason();

  const [{ data: streamKey }, { data: playlist }] = await Promise.all([
    supabase.from("stream_keys").select("id,name,youtube_live_stream_id,rtmp_url,stream_key").eq("id", parsed.data.streamKeyId).maybeSingle(),
    supabase.from("playlists").select("id,name,youtube_playlist_id").eq("id", parsed.data.playlistId).maybeSingle(),
  ]);

  if (!streamKey || !playlist) {
    return { error: "No se encontraron recursos asociados." };
  }

  const title = `${parsed.data.homeTeamName} vs ${parsed.data.awayTeamName} | ${parsed.data.competitionName}`;
  let youtubeResult;
  try {
    youtubeResult = await createYouTubeBroadcast({
      title,
      description: parsed.data.description ?? "",
      scheduledStart: scheduledStartIso,
      playlistId: playlist.youtube_playlist_id,
      youtubeLiveStreamId: streamKey.youtube_live_stream_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido YouTube";
    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "create_broadcast",
      status: "failed",
      message: "Error en YouTube",
      metadata: sanitizeForLog({ reason: message }),
    });

    if (/invalid_grant/i.test(message)) {
      return { error: "Credenciales OAuth de YouTube invalidas o caducadas. Revisa refresh token." };
    }
    if (/quota|rateLimitExceeded|userRequestsExceedRateLimit/i.test(message)) {
      return { error: "Cuota de YouTube agotada temporalmente." };
    }
    return { error: `YouTube fallo al crear el directo: ${message}` };
  }

  if (youtubeResult.videoId) {
    await applyThumbnailToYouTube(youtubeResult.videoId, {
      homeTeamName: parsed.data.homeTeamName,
      awayTeamName: parsed.data.awayTeamName,
      homeCrestUrl: parsed.data.homeCrestUrl,
      awayCrestUrl: parsed.data.awayCrestUrl,
      thumbnailPayload: parsed.data.thumbnailPayload,
      thumbnailBackgroundId: parsed.data.thumbnailBackgroundId,
    });
  }

  const insertPayload: any = {
    created_by: session.userId,
    season_id: season.id,
    team_id: parsed.data.teamId,
    stream_key_id: parsed.data.streamKeyId,
    playlist_id: parsed.data.playlistId,
    thumbnail_background_id: parsed.data.thumbnailBackgroundId || null,
    title,
    description: parsed.data.description ?? null,
    scheduled_start: scheduledStartIso,
    competition_name: parsed.data.competitionName,
    venue: parsed.data.venue ?? null,
    home_team_name: parsed.data.homeTeamName,
    away_team_name: parsed.data.awayTeamName,
    home_crest_url: parsed.data.homeCrestUrl ?? null,
    away_crest_url: parsed.data.awayCrestUrl ?? null,
    federation_source: parsed.data.federationSource ?? "manual",
    federation_match_id: parsed.data.federationMatchId ?? null,
    privacy_status: "unlisted",
    youtube_broadcast_id: youtubeResult.broadcastId,
    youtube_video_id: youtubeResult.videoId,
    youtube_watch_url: youtubeResult.watchUrl,
    youtube_share_url: youtubeResult.shareUrl,
    youtube_embed_url: youtubeResult.embedUrl,
    youtube_playlist_id: playlist.youtube_playlist_id,
    youtube_bound_stream_id: streamKey.youtube_live_stream_id,
    youtube_life_cycle_status: "ready",
    youtube_sync_status: youtubeResult.syncStatus,
    last_youtube_sync_at: new Date().toISOString(),
    confirmed_legal_basis: true,
    confirmed_by: session.userId,
    confirmed_at: new Date().toISOString(),
  };

  if (parsed.data.thumbnailPayload) {
    try {
      insertPayload.thumbnail_payload = JSON.parse(parsed.data.thumbnailPayload);
    } catch (_) {}
  }
  if (parsed.data.thumbnailOverrides) {
    try {
      insertPayload.thumbnail_overrides = JSON.parse(parsed.data.thumbnailOverrides);
    } catch (_) {}
  }

  let { data: inserted, error: insertError } = await supabase
    .from("broadcasts")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError && (insertError.message.includes("thumbnail_payload") || insertError.message.includes("thumbnail_overrides"))) {
    console.warn("La tabla broadcasts no tiene las columnas de miniaturas. Reintentando inserción sin ellas...");
    delete insertPayload.thumbnail_payload;
    delete insertPayload.thumbnail_overrides;
    
    const retry = await supabase
      .from("broadcasts")
      .insert(insertPayload)
      .select("id")
      .single();
      
    inserted = retry.data;
    insertError = retry.error;
  }

  if (insertError || !inserted) {
    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "create_broadcast",
      status: "failed",
      message: "Error insertando broadcast",
      metadata: sanitizeForLog({ reason: insertError?.message }),
    });
    return { error: `No se pudo guardar el broadcast en base de datos. Detalles: ${insertError?.message || "Registro no devuelto"}` };
  }

  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    broadcast_id: inserted.id,
    operation_type: "create_broadcast",
    status: "ok",
    message: "Broadcast creado y sincronizado con YouTube",
    metadata: sanitizeForLog({
      youtubeBroadcastId: youtubeResult.broadcastId,
      youtubeVideoId: youtubeResult.videoId,
      streamKeyId: parsed.data.streamKeyId,
      playlistId: parsed.data.playlistId,
    }),
  });

  redirect(`/dashboard/broadcasts/${inserted.id}/success`);
}

export async function syncChannelBroadcastsAction(_prev: SyncBroadcastState): Promise<SyncBroadcastState> {
  const session = await requireSession();
  const supabase = getSupabaseServerClient();
  const startedAt = new Date().toISOString();

  try {
    const { data: latestRun } = await supabase
      .from("youtube_sync_runs")
      .select("finished_at,status")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRun?.finished_at && latestRun.status === "ok") {
      const seconds = (Date.now() - new Date(latestRun.finished_at).getTime()) / 1000;
      if (seconds < 45) {
        return { ok: "Sync reciente detectada. Mostrando datos actualizados." };
      }
    }
  } catch {
    // no-op: continue with sync
  }

  const { data: runRow, error: runStartError } = await supabase
    .from("youtube_sync_runs")
    .insert({
      started_at: startedAt,
      status: "running",
      triggered_by: session.userId,
      trigger_source: session.role === "admin" ? "admin" : "user",
      resource_type: "all",
      metadata: { source: "syncChannelBroadcastsAction" },
    })
    .select("id")
    .single();

  const runId = runStartError ? null : runRow?.id ?? null;

  try {
    // 0. Auto-expire broadcasts older than 24 hours
    try {
      await expirePendingBroadcasts();
    } catch (expireErr) {
      console.error("Auto-expiration failed during sync:", expireErr);
    }

    const [channelBroadcasts, channelStreams, channelPlaylists, channelVideos] = await Promise.all([
      listYouTubeChannelBroadcasts(),
      listYouTubeChannelStreams(),
      listYouTubeChannelPlaylists(),
      listYouTubeChannelVideos(),
    ]);

    const nowIso = new Date().toISOString();
    let streamsUpserted = 0;
    let playlistsUpserted = 0;
    let broadcastsUpdated = 0;
    let externalUpserted = 0;
    let videosUpserted = 0;

    for (const stream of channelStreams) {
      const fallbackName = `YouTube Stream ${stream.youtubeLiveStreamId.slice(0, 8)}`;
      const safeName = stream.title?.trim() ? `${stream.title} [${stream.youtubeLiveStreamId.slice(0, 6)}]` : fallbackName;

      const { error } = await supabase.from("stream_keys").upsert(
        {
          name: safeName,
          youtube_live_stream_id: stream.youtubeLiveStreamId,
          stream_key: stream.streamName ?? `external-${stream.youtubeLiveStreamId}`,
          rtmp_url: stream.ingestionAddress ?? "https://a.rtmp.youtube.com/live2",
          backup_rtmp_url: stream.backupIngestionAddress,
          youtube_channel_id: stream.youtubeChannelId,
          youtube_stream_title: stream.title,
          youtube_stream_status: stream.streamStatus,
          youtube_health_status: stream.healthStatus,
          youtube_health_issues: stream.healthIssues,
          is_reusable: stream.isReusable,
          sync_origin: "youtube_sync",
          last_youtube_sync_at: nowIso,
          last_youtube_error: null,
          youtube_deleted_at: null,
          active: true,
        },
        { onConflict: "youtube_live_stream_id" },
      );
      if (!error) streamsUpserted += 1;
    }

    for (const playlist of channelPlaylists) {
      const { error } = await supabase.from("playlists").upsert(
        {
          name: playlist.title,
          youtube_playlist_id: playlist.youtubePlaylistId,
          description: playlist.description,
          youtube_channel_id: playlist.youtubeChannelId,
          youtube_privacy_status: playlist.privacyStatus,
          youtube_item_count: playlist.itemCount,
          sync_origin: "youtube_sync",
          last_youtube_sync_at: nowIso,
          last_youtube_error: null,
          youtube_deleted_at: null,
          active: true,
        },
        { onConflict: "youtube_playlist_id" },
      );
      if (!error) playlistsUpserted += 1;
    }

    for (const item of channelBroadcasts) {
      const { data: localOwned } = await supabase
        .from("broadcasts")
        .select("id")
        .eq("youtube_broadcast_id", item.youtubeBroadcastId)
        .maybeSingle();

      if (localOwned?.id) {
        await supabase
          .from("broadcasts")
          .update({
            title: item.title,
            description: item.description,
            scheduled_start: item.scheduledStart ?? nowIso,
            privacy_status: item.privacyStatus ?? "unlisted",
            youtube_video_id: item.youtubeBroadcastId,
            youtube_watch_url: item.watchUrl,
            youtube_share_url: item.shareUrl,
            youtube_embed_url: item.embedUrl,
            youtube_life_cycle_status: item.lifeCycleStatus ?? "unknown",
            youtube_bound_stream_id: item.boundStreamId,
            actual_start_time: item.actualStart,
            actual_end_time: item.actualEnd,
            youtube_raw_status: item.rawStatus,
            youtube_raw_content_details: item.rawContentDetails,
            youtube_sync_status: "synced",
            last_youtube_sync_at: nowIso,
            youtube_last_error: null,
          })
          .eq("id", localOwned.id);
        broadcastsUpdated += 1;
        continue;
      }

      await supabase.from("youtube_external_broadcasts").upsert(
        {
          youtube_broadcast_id: item.youtubeBroadcastId,
          youtube_video_id: item.youtubeBroadcastId,
          youtube_bound_stream_id: item.boundStreamId,
          title: item.title,
          description: item.description,
          scheduled_start: item.scheduledStart,
          actual_start_time: item.actualStart,
          actual_end_time: item.actualEnd,
          privacy_status: item.privacyStatus,
          youtube_life_cycle_status: item.lifeCycleStatus ?? "unknown",
          youtube_watch_url: item.watchUrl,
          youtube_share_url: item.shareUrl,
          youtube_embed_url: item.embedUrl,
          last_youtube_sync_at: nowIso,
          raw_payload: {
            status: item.rawStatus,
            contentDetails: item.rawContentDetails,
          },
        },
        { onConflict: "youtube_broadcast_id" },
      );
      externalUpserted += 1;
    }

    // 0.5. Check for broadcasts that exist locally but were deleted from YouTube
    const youtubeBroadcastIds = new Set(channelBroadcasts.map((cb) => cb.youtubeBroadcastId));
    const { data: localActiveBroadcasts } = await supabase
      .from("broadcasts")
      .select("id, youtube_broadcast_id, title")
      .is("deleted_at", null)
      .neq("youtube_life_cycle_status", "complete");

    if (localActiveBroadcasts) {
      for (const localBc of localActiveBroadcasts) {
        if (localBc.youtube_broadcast_id && !youtubeBroadcastIds.has(localBc.youtube_broadcast_id)) {
          console.log(`Local broadcast '${localBc.title}' (ID: ${localBc.id}) not found on YouTube. Marking as deleted.`);
          await supabase
            .from("broadcasts")
            .update({
              deleted_at: new Date().toISOString(),
              youtube_life_cycle_status: "complete",
              youtube_last_error: "Eliminado o cancelado desde YouTube Studio.",
            })
            .eq("id", localBc.id);

          await supabase.from("operation_logs").insert({
            user_id: session.userId,
            broadcast_id: localBc.id,
            operation_type: "sync_delete_broadcast",
            status: "ok",
            message: `Programación eliminada localmente tras ser borrada en YouTube Studio: ${localBc.title}`,
            metadata: sanitizeForLog({ id: localBc.id, youtubeBroadcastId: localBc.youtube_broadcast_id }),
          });
        }
      }
    }

    for (const video of channelVideos) {
      try {
        const { error: videoError } = await supabase.from("youtube_channel_videos").upsert(
          {
            youtube_video_id: video.youtubeVideoId,
            title: video.title,
            description: video.description,
            published_at: video.publishedAt,
            video_type: video.videoType,
            youtube_watch_url: video.watchUrl,
            youtube_share_url: video.shareUrl,
            youtube_embed_url: video.embedUrl,
            playlist_ids: video.playlistIds,
            last_youtube_sync_at: nowIso,
          },
          { onConflict: "youtube_video_id" },
        );
        if (!videoError) {
          videosUpserted += 1;
        } else {
          console.error(`Failed to cache video ${video.youtubeVideoId}:`, videoError.message);
        }
      } catch (err) {
        console.warn(`Resilience guard: Failed to cache video ${video.youtubeVideoId} (table might not exist yet):`, err);
      }
    }

    if (runId) {
      await supabase
        .from("youtube_sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "ok",
          items_seen: channelBroadcasts.length + channelStreams.length + channelPlaylists.length + channelVideos.length,
          items_upserted: streamsUpserted + playlistsUpserted + broadcastsUpdated + externalUpserted + videosUpserted,
          items_failed: 0,
          metadata: {
            broadcastsSeen: channelBroadcasts.length,
            streamsSeen: channelStreams.length,
            playlistsSeen: channelPlaylists.length,
            videosSeen: channelVideos.length,
            streamsUpserted,
            playlistsUpserted,
            broadcastsUpdated,
            externalUpserted,
            videosUpserted,
          },
        })
        .eq("id", runId);
    }

    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "sync_channel_broadcasts",
      status: "ok",
      message: "Sincronizacion YouTube completa (streams/playlists/broadcasts/external/videos)",
      metadata: sanitizeForLog({
        broadcastsSeen: channelBroadcasts.length,
        streamsSeen: channelStreams.length,
        playlistsSeen: channelPlaylists.length,
        videosSeen: channelVideos.length,
        streamsUpserted,
        playlistsUpserted,
        broadcastsUpdated,
        externalUpserted,
        videosUpserted,
      }),
    });

    await revalidateAllResourcePaths();

    return {
      ok: `Sync OK. Streams: ${streamsUpserted}/${channelStreams.length}. Playlists: ${playlistsUpserted}/${channelPlaylists.length}. Broadcasts locales: ${broadcastsUpdated}. Externos: ${externalUpserted}. Videos cacheados: ${videosUpserted}/${channelVideos.length}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido en sync YouTube";

    if (runId) {
      await supabase
        .from("youtube_sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error_message: message,
          items_failed: 1,
        })
        .eq("id", runId);
    }

    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "sync_channel_broadcasts",
      status: "failed",
      message: "Fallo sincronizando YouTube",
      metadata: sanitizeForLog({ reason: message }),
    });

    return { error: `No se pudo sincronizar YouTube: ${message}` };
  }
}

export async function endBroadcastAction(_prev: EndBroadcastState, formData: FormData): Promise<EndBroadcastState> {
  const session = await requireSession();
  const id = String(formData.get("id") || "").trim();
  if (!id) return { error: "Falta identificador del broadcast." };

  const supabase = getSupabaseServerClient();
  const { data: row } = await supabase
    .from("broadcasts")
    .select("id,title,youtube_broadcast_id,created_by")
    .eq("id", id)
    .maybeSingle();

  if (!row?.youtube_broadcast_id) {
    return { error: "El broadcast no tiene youtube_broadcast_id." };
  }

  const isAdmin = session.role === "admin";
  if (!isAdmin && row.created_by !== session.userId) {
    return { error: "No tienes permisos para finalizar esta emision." };
  }

  try {
    await endYouTubeBroadcast({ youtubeBroadcastId: row.youtube_broadcast_id });

    await supabase
      .from("broadcasts")
      .update({
        youtube_life_cycle_status: "complete",
        youtube_sync_status: "synced",
        actual_end_time: new Date().toISOString(),
        ended_by: session.userId,
        ended_at: new Date().toISOString(),
        end_reason: isAdmin ? "manual_admin" : "manual_owner",
        last_youtube_sync_at: new Date().toISOString(),
        youtube_last_error: null,
      })
      .eq("id", id);

    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      broadcast_id: id,
      operation_type: "end_broadcast",
      status: "ok",
      message: isAdmin ? "Broadcast finalizado desde admin" : "Broadcast finalizado por creador",
      metadata: sanitizeForLog({ youtubeBroadcastId: row.youtube_broadcast_id, title: row.title }),
    });

    await revalidateAllResourcePaths();

    return { ok: "Emision finalizada." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido YouTube";

    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      broadcast_id: id,
      operation_type: "end_broadcast",
      status: "failed",
      message: "Fallo al finalizar broadcast",
      metadata: sanitizeForLog({ reason: message, youtubeBroadcastId: row.youtube_broadcast_id }),
    });

    return { error: `No se pudo finalizar la emision: ${message}` };
  }
}

export type AssignExternalBroadcastState = {
  error?: string;
  ok?: string;
};

const assignExternalSchema = z.object({
  externalBroadcastId: z.uuid(),
  teamId: z.uuid(),
  streamKeyId: z.uuid(),
  playlistId: z.string().trim().optional(),
  homeTeamName: z.string().trim().min(2).max(120),
  awayTeamName: z.string().trim().min(2).max(120),
  competitionName: z.string().trim().min(2).max(120),
  venue: z.string().trim().max(120).optional(),
});

export async function assignExternalBroadcastAction(
  _prev: AssignExternalBroadcastState,
  formData: FormData,
): Promise<AssignExternalBroadcastState> {
  const session = await requireAdmin();
  const supabase = getSupabaseServerClient();
  const season = await getSelectedSeason();

  const parsed = assignExternalSchema.safeParse({
    externalBroadcastId: formData.get("externalBroadcastId"),
    teamId: formData.get("teamId"),
    streamKeyId: formData.get("streamKeyId"),
    playlistId: formData.get("playlistId") || undefined,
    homeTeamName: formData.get("homeTeamName"),
    awayTeamName: formData.get("awayTeamName"),
    competitionName: formData.get("competitionName"),
    venue: formData.get("venue") || undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return { error: firstIssue ? `Datos no válidos: ${firstIssue}` : "Datos de formulario no válidos." };
  }

  // 1. Fetch external broadcast
  const { data: ext, error: extError } = await supabase
    .from("youtube_external_broadcasts")
    .select("*")
    .eq("id", parsed.data.externalBroadcastId)
    .maybeSingle();

  if (extError || !ext) {
    return { error: "No se encontró el directo externo de YouTube." };
  }

  if (ext.matched_broadcast_id) {
    return { error: "Este directo externo ya está asignado." };
  }

  // 2. Fetch resources to make sure they exist
  const [{ data: team }, { data: streamKey }] = await Promise.all([
    supabase.from("teams").select("id,name").eq("id", parsed.data.teamId).maybeSingle(),
    supabase.from("stream_keys").select("id,name,youtube_live_stream_id,rtmp_url").eq("id", parsed.data.streamKeyId).maybeSingle(),
  ]);

  if (!team || !streamKey) {
    return { error: "No se encontró el equipo o la stream key seleccionada." };
  }

  let playlistRow = null;
  if (parsed.data.playlistId) {
    const { data } = await supabase
      .from("playlists")
      .select("id,youtube_playlist_id")
      .eq("id", parsed.data.playlistId)
      .maybeSingle();
    playlistRow = data;
  }

  const title = `${parsed.data.homeTeamName} vs ${parsed.data.awayTeamName} | ${parsed.data.competitionName}`;

  // 3. Create local broadcast
  const { data: inserted, error: insertError } = await supabase
    .from("broadcasts")
    .insert({
      created_by: session.userId,
      season_id: season.id,
      team_id: parsed.data.teamId,
      stream_key_id: parsed.data.streamKeyId,
      playlist_id: playlistRow?.id || null,
      title,
      description: ext.description,
      scheduled_start: ext.scheduled_start || new Date().toISOString(),
      competition_name: parsed.data.competitionName,
      venue: parsed.data.venue || null,
      home_team_name: parsed.data.homeTeamName,
      away_team_name: parsed.data.awayTeamName,
      privacy_status: "unlisted",
      youtube_broadcast_id: ext.youtube_broadcast_id,
      youtube_video_id: ext.youtube_video_id,
      youtube_watch_url: ext.youtube_watch_url,
      youtube_share_url: ext.youtube_share_url,
      youtube_embed_url: ext.youtube_embed_url,
      youtube_playlist_id: playlistRow?.youtube_playlist_id || null,
      youtube_bound_stream_id: streamKey.youtube_live_stream_id,
      youtube_life_cycle_status: ext.youtube_life_cycle_status || "ready",
      youtube_sync_status: "synced",
      last_youtube_sync_at: new Date().toISOString(),
      confirmed_legal_basis: true,
      confirmed_by: session.userId,
      confirmed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Failed to insert local broadcast for assignment:", insertError?.message);
    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "assign_external_broadcast",
      status: "failed",
      message: "Error al insertar broadcast local",
      metadata: sanitizeForLog({ reason: insertError?.message }),
    });
    return { error: `No se pudo guardar el broadcast local: ${insertError?.message}` };
  }

  // 4. Link external broadcast to new local broadcast
  const { error: updateError } = await supabase
    .from("youtube_external_broadcasts")
    .update({ matched_broadcast_id: inserted.id })
    .eq("id", ext.id);

  if (updateError) {
    console.error("Failed to update external broadcast matched_broadcast_id:", updateError.message);
    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "assign_external_broadcast",
      status: "failed",
      message: "Error al actualizar vinculación de directo externo",
      metadata: sanitizeForLog({ reason: updateError.message }),
    });
    return { error: "No se pudo actualizar la vinculación en el directo externo." };
  }

  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    broadcast_id: inserted.id,
    operation_type: "assign_external_broadcast",
    status: "ok",
    message: "Directo de YouTube Studio asignado exitosamente a equipo",
    metadata: sanitizeForLog({
      externalBroadcastId: parsed.data.externalBroadcastId,
      youtubeBroadcastId: ext.youtube_broadcast_id,
      teamId: parsed.data.teamId,
      streamKeyId: parsed.data.streamKeyId,
    }),
  });

  await revalidateAllResourcePaths();

  return { ok: "Directo asignado y vinculado exitosamente." };
}

export type DeleteBroadcastState = {
  error?: string;
  ok?: string;
};

export type DeleteChannelContentState = {
  error?: string;
  ok?: string;
};

export async function deleteChannelContentAction(
  _prev: DeleteChannelContentState,
  formData: FormData,
): Promise<DeleteChannelContentState> {
  const session = await requireAdmin();
  const youtubeVideoId = String(formData.get("youtubeVideoId") || "").trim();
  if (!youtubeVideoId) return { error: "Falta youtubeVideoId." };

  const supabase = getSupabaseServerClient();

  let youtubeDeletedMessage = "Contenido eliminado correctamente en YouTube y app.";
  try {
    await deleteYouTubeVideo({ youtubeVideoId });
  } catch (error) {
    const errObj = error as any;
    const message = errObj.message || (errObj.errors?.[0]?.message) || String(error);
    const code = errObj.code || errObj.status;
    const isNotFound = code === 404 || 
                       String(code) === "404" ||
                       message.toLowerCase().includes("cannot be found") || 
                       message.toLowerCase().includes("not found");

    if (isNotFound) {
      console.warn(`Video ${youtubeVideoId} not found on YouTube, proceeding with local cleanup.`, error);
      youtubeDeletedMessage = "El video no existía en YouTube. Se ha limpiado correctamente de la app.";
    } else {
      return { error: `No se pudo borrar en YouTube: ${message}` };
    }
  }

  await supabase
    .from("youtube_channel_videos")
    .delete()
    .eq("youtube_video_id", youtubeVideoId);

  await supabase
    .from("broadcasts")
    .update({
      deleted_at: new Date().toISOString(),
      youtube_life_cycle_status: "complete",
      youtube_last_error: "Eliminado desde Buscador de contenidos.",
    })
    .eq("youtube_video_id", youtubeVideoId)
    .is("deleted_at", null);

  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    operation_type: "delete_channel_content",
    status: "ok",
    message: "Contenido eliminado desde buscador de contenidos",
    metadata: sanitizeForLog({ youtubeVideoId }),
  });

  await revalidateAllResourcePaths();
  revalidatePath("/admin/event-links");

  return { ok: youtubeDeletedMessage };
}

export async function deleteBroadcastAction(_prev: DeleteBroadcastState, formData: FormData): Promise<DeleteBroadcastState> {
  const session = await requireSession();
  const id = String(formData.get("id") || "").trim();
  if (!id) return { error: "Falta identificador del broadcast." };

  const supabase = getSupabaseServerClient();
  const { data: row } = await supabase
    .from("broadcasts")
    .select("id,title,youtube_broadcast_id,created_by")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    return { error: "No se encontró el broadcast." };
  }

  if (session.role !== "admin" && (session.role as string) !== "superadmin" && row.created_by !== session.userId) {
    return { error: "No tienes permisos para eliminar esta programación." };
  }

  // 1. Delete from YouTube
  if (row.youtube_broadcast_id) {
    try {
      await deleteYouTubeBroadcast({ youtubeBroadcastId: row.youtube_broadcast_id });
    } catch (error) {
      console.error(`Failed to delete broadcast ${row.youtube_broadcast_id} from YouTube:`, error);
      // Proceed to soft delete locally anyway so resources are freed up
    }
  }

  // 2. Soft delete locally
  const { error: updateError } = await supabase
    .from("broadcasts")
    .update({
      deleted_at: new Date().toISOString(),
      youtube_life_cycle_status: "complete", // Mark as complete to avoid active syncs
    })
    .eq("id", id);

  if (updateError) {
    return { error: `No se pudo eliminar el broadcast localmente: ${updateError.message}` };
  }

  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    broadcast_id: id,
    operation_type: "delete_broadcast",
    status: "ok",
    message: "Broadcast eliminado por el administrador",
    metadata: sanitizeForLog({ youtubeBroadcastId: row.youtube_broadcast_id, title: row.title }),
  });

  await revalidateAllResourcePaths();

  return { ok: "Broadcast eliminado correctamente." };
}

export type UpdateBroadcastState = {
  error?: string;
  ok?: boolean;
};

export async function updateBroadcastAction(_prev: UpdateBroadcastState, formData: FormData): Promise<UpdateBroadcastState> {
  const session = await requireSession();

  const parsed = updateBroadcastSchema.safeParse({
    id: formData.get("id"),
    teamId: formData.get("teamId"),
    streamKeyId: formData.get("streamKeyId"),
    playlistId: formData.get("playlistId"),
    competitionName: formData.get("competitionName"),
    homeTeamName: formData.get("homeTeamName"),
    awayTeamName: formData.get("awayTeamName"),
    homeCrestUrl: formData.get("homeCrestUrl") || undefined,
    awayCrestUrl: formData.get("awayCrestUrl") || undefined,
    venue: formData.get("venue") || undefined,
    scheduledStart: formData.get("scheduledStart"),
    description: formData.get("description") || undefined,
    federationSource: formData.get("federationSource") || undefined,
    federationMatchId: formData.get("federationMatchId") || undefined,
    federationTeamKey: formData.get("federationTeamKey") || undefined,
    thumbnailPayload: formData.get("thumbnailPayload") || undefined,
    thumbnailOverrides: formData.get("thumbnailOverrides") || undefined,
    thumbnailBackgroundId: formData.get("thumbnailBackgroundId") || null,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return { error: firstIssue ? `Datos no válidos: ${firstIssue}` : "Datos de formulario no validos." };
  }

  const scheduledDate = new Date(parsed.data.scheduledStart);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { error: "Fecha/hora no valida." };
  }
  const scheduledStartIso = scheduledDate.toISOString();

  const supabase = getSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("broadcasts")
    .select("id, youtube_broadcast_id, youtube_video_id, created_by")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "No se encontró el broadcast a actualizar." };
  }

  const isAdmin = session.role === "admin" || (session.role as string) === "superadmin";

  if (!isAdmin && existing.created_by !== session.userId) {
    return { error: "No tienes permisos para actualizar esta programación." };
  }

  // Check resource permissions for non-admin users
  if (!isAdmin) {
    try {
      await assertCurrentUserHasAssignedResources({
        teamId: parsed.data.teamId,
        streamKeyId: parsed.data.streamKeyId,
        playlistId: parsed.data.playlistId,
      });
    } catch {
      return { error: "No tienes permisos para uno o mas recursos seleccionados." };
    }
  }

  // Check federation team key access
  if (parsed.data.federationTeamKey) {
    const hasAccess = await userHasAccessToRivasTeam(session.email ?? "", isAdmin, parsed.data.federationTeamKey);
    if (!hasAccess) {
      return { error: "No tienes permisos para programar directos de este equipo federado." };
    }
  }

  const [{ data: streamKey }, { data: playlist }] = await Promise.all([
    supabase.from("stream_keys").select("id,name,youtube_live_stream_id,rtmp_url,stream_key").eq("id", parsed.data.streamKeyId).maybeSingle(),
    supabase.from("playlists").select("id,name,youtube_playlist_id").eq("id", parsed.data.playlistId).maybeSingle(),
  ]);

  if (!streamKey || !playlist) {
    return { error: "No se encontraron los recursos asociados." };
  }

  const title = `${parsed.data.homeTeamName} vs ${parsed.data.awayTeamName} | ${parsed.data.competitionName}`;

  // 1. Update YouTube snippet
  if (existing.youtube_broadcast_id) {
    try {
      await updateYouTubeBroadcast({
        youtubeBroadcastId: existing.youtube_broadcast_id,
        title,
        description: parsed.data.description ?? "",
        scheduledStart: scheduledStartIso,
      });

      if (existing.youtube_video_id) {
        await applyThumbnailToYouTube(existing.youtube_video_id, {
          homeTeamName: parsed.data.homeTeamName,
          awayTeamName: parsed.data.awayTeamName,
          homeCrestUrl: parsed.data.homeCrestUrl,
          awayCrestUrl: parsed.data.awayCrestUrl,
          thumbnailPayload: parsed.data.thumbnailPayload,
          thumbnailBackgroundId: parsed.data.thumbnailBackgroundId,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido YouTube";
      await supabase.from("operation_logs").insert({
        user_id: session.userId,
        broadcast_id: parsed.data.id,
        operation_type: "update_broadcast",
        status: "failed",
        message: "Error actualizando en YouTube",
        metadata: sanitizeForLog({ reason: message }),
      });
      return { error: `Fallo al actualizar en YouTube: ${message}` };
    }
  }

  // 2. Update local DB
  const updatePayload: any = {
    team_id: parsed.data.teamId,
    stream_key_id: parsed.data.streamKeyId,
    playlist_id: parsed.data.playlistId,
    thumbnail_background_id: parsed.data.thumbnailBackgroundId || null,
    title,
    description: parsed.data.description ?? null,
    scheduled_start: scheduledStartIso,
    competition_name: parsed.data.competitionName,
    venue: parsed.data.venue ?? null,
    home_team_name: parsed.data.homeTeamName,
    away_team_name: parsed.data.awayTeamName,
    home_crest_url: parsed.data.homeCrestUrl ?? null,
    away_crest_url: parsed.data.awayCrestUrl ?? null,
    federation_source: parsed.data.federationSource ?? "manual",
    federation_match_id: parsed.data.federationMatchId ?? null,
    youtube_playlist_id: playlist.youtube_playlist_id,
    youtube_bound_stream_id: streamKey.youtube_live_stream_id,
  };

  if (parsed.data.thumbnailPayload) {
    try {
      updatePayload.thumbnail_payload = JSON.parse(parsed.data.thumbnailPayload);
    } catch (_) {}
  }
  if (parsed.data.thumbnailOverrides) {
    try {
      updatePayload.thumbnail_overrides = JSON.parse(parsed.data.thumbnailOverrides);
    } catch (_) {}
  }

  const { error: updateError } = await supabase
    .from("broadcasts")
    .update(updatePayload)
    .eq("id", parsed.data.id);

  if (updateError) {
    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      broadcast_id: parsed.data.id,
      operation_type: "update_broadcast",
      status: "failed",
      message: "Error actualizando fila en DB",
      metadata: sanitizeForLog({ reason: updateError.message }),
    });
    return { error: `No se pudo actualizar en base de datos: ${updateError.message}` };
  }

  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    broadcast_id: parsed.data.id,
    operation_type: "update_broadcast",
    status: "ok",
    message: "Broadcast editado por administrador",
    metadata: sanitizeForLog({
      youtubeBroadcastId: existing.youtube_broadcast_id,
      streamKeyId: parsed.data.streamKeyId,
      playlistId: parsed.data.playlistId,
    }),
  });

  await revalidateAllResourcePaths();

  return { ok: true };
}
