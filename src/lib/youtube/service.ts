import "server-only";

import { randomUUID } from "node:crypto";
import { google } from "googleapis";
import { serverEnv } from "@/src/lib/validation/env";

export type YouTubeCreateResult = {
  broadcastId: string;
  videoId: string;
  watchUrl: string;
  shareUrl: string;
  embedUrl: string;
  syncStatus: "synced" | "failed";
};

export type YouTubeCreateLiveStreamResult = {
  youtubeLiveStreamId: string;
  title: string;
  streamKey: string;
  rtmpUrl: string;
};

export type YouTubeCreatePlaylistResult = {
  youtubePlaylistId: string;
  title: string;
  description: string;
};

export async function createYouTubeBroadcastMock(input: {
  title: string;
  description: string;
  scheduledStart: string;
  playlistId: string;
  youtubeLiveStreamId: string;
}): Promise<YouTubeCreateResult> {
  if (serverEnv.YOUTUBE_MOCK_MODE !== "true") {
    throw new Error("Modo real YouTube aun no implementado en esta fase.");
  }

  const suffix = randomUUID().replace(/-/g, "").slice(0, 11);
  const broadcastId = `mock-bc-${suffix}`;
  const videoId = suffix;

  return {
    broadcastId,
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    shareUrl: `https://youtube.com/live/${videoId}?feature=share`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    syncStatus: "synced",
  };
}

function getYoutubeEnv(name: "YOUTUBE_CLIENT_ID" | "YOUTUBE_CLIENT_SECRET" | "YOUTUBE_REFRESH_TOKEN") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} no configurado`);
  }
  return value;
}

function getYoutubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    getYoutubeEnv("YOUTUBE_CLIENT_ID"),
    getYoutubeEnv("YOUTUBE_CLIENT_SECRET"),
    process.env.YOUTUBE_TOKEN_URI ?? "https://oauth2.googleapis.com/token",
  );

  oauth2Client.setCredentials({
    refresh_token: getYoutubeEnv("YOUTUBE_REFRESH_TOKEN"),
  });

  return google.youtube({ version: "v3", auth: oauth2Client });
}

export async function createYouTubeBroadcast(input: {
  title: string;
  description: string;
  scheduledStart: string;
  playlistId: string;
  youtubeLiveStreamId: string;
}): Promise<YouTubeCreateResult> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return createYouTubeBroadcastMock(input);
  }

  const youtube = getYoutubeClient();

  const created = await youtube.liveBroadcasts.insert({
    part: ["snippet", "status", "contentDetails"],
    requestBody: {
      snippet: {
        title: input.title,
        description: input.description,
        scheduledStartTime: input.scheduledStart,
      },
      status: {
        privacyStatus: "unlisted",
      },
      contentDetails: {
        latencyPreference: "normal",
        enableAutoStart: true,
        enableAutoStop: false,
      },
    },
  });

  const broadcastId = created.data.id;
  if (!broadcastId) {
    throw new Error("YouTube no devolvio broadcastId");
  }

  await youtube.liveBroadcasts.bind({
    part: ["id", "contentDetails"],
    id: broadcastId,
    streamId: input.youtubeLiveStreamId,
  });

  await youtube.playlistItems.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        playlistId: input.playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId: broadcastId,
        },
      },
    },
  });

  return {
    broadcastId,
    videoId: broadcastId,
    watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
    shareUrl: `https://youtube.com/live/${broadcastId}?feature=share`,
    embedUrl: `https://www.youtube.com/embed/${broadcastId}`,
    syncStatus: "synced",
  };
}

export async function createYouTubeLiveStream(input: { title: string }): Promise<YouTubeCreateLiveStreamResult> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 10);
    return {
      youtubeLiveStreamId: `mock-stream-${suffix}`,
      title: input.title,
      streamKey: `mock-key-${suffix}`,
      rtmpUrl: "rtmps://a.rtmp.youtube.com/live2",
    };
  }

  const youtube = getYoutubeClient();
  const created = await youtube.liveStreams.insert({
    part: ["snippet", "cdn", "contentDetails"],
    requestBody: {
      snippet: {
        title: input.title,
      },
      cdn: {
        frameRate: "variable",
        resolution: "variable",
        ingestionType: "rtmp",
      },
      contentDetails: {
        isReusable: true,
      },
    },
  });

  const item = created.data;
  const youtubeLiveStreamId = item.id;
  const streamKey = item.cdn?.ingestionInfo?.streamName;
  const rtmpUrl = item.cdn?.ingestionInfo?.ingestionAddress;

  if (!youtubeLiveStreamId || !streamKey || !rtmpUrl) {
    throw new Error("YouTube no devolvio datos completos de stream key.");
  }

  return {
    youtubeLiveStreamId,
    title: item.snippet?.title ?? input.title,
    streamKey,
    rtmpUrl,
  };
}

export async function createYouTubePlaylist(input: { title: string; description?: string }): Promise<YouTubeCreatePlaylistResult> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    const suffix = randomUUID().replace(/-/g, "").slice(0, 10);
    return {
      youtubePlaylistId: `mock-playlist-${suffix}`,
      title: input.title,
      description: input.description ?? "",
    };
  }

  const youtube = getYoutubeClient();
  const created = await youtube.playlists.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: input.title,
        description: input.description ?? "",
      },
      status: {
        privacyStatus: "unlisted",
      },
    },
  });

  const item = created.data;
  const youtubePlaylistId = item.id;
  if (!youtubePlaylistId) {
    throw new Error("YouTube no devolvio playlistId.");
  }

  return {
    youtubePlaylistId,
    title: item.snippet?.title ?? input.title,
    description: item.snippet?.description ?? input.description ?? "",
  };
}

export type YouTubeChannelBroadcast = {
  youtubeBroadcastId: string;
  title: string;
  description: string | null;
  scheduledStart: string | null;
  privacyStatus: string | null;
  lifeCycleStatus: string | null;
  boundStreamId: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  watchUrl: string;
  shareUrl: string;
  embedUrl: string;
  rawStatus: Record<string, unknown>;
  rawContentDetails: Record<string, unknown>;
};

export type YouTubeChannelStream = {
  youtubeLiveStreamId: string;
  title: string;
  youtubeChannelId: string | null;
  ingestionAddress: string | null;
  backupIngestionAddress: string | null;
  streamName: string | null;
  streamStatus: string | null;
  healthStatus: string | null;
  healthIssues: Array<Record<string, unknown>>;
  isReusable: boolean;
  rawStatus: Record<string, unknown>;
};

export type YouTubeChannelPlaylist = {
  youtubePlaylistId: string;
  title: string;
  description: string | null;
  youtubeChannelId: string | null;
  privacyStatus: string | null;
  itemCount: number | null;
};

export async function listYouTubeChannelBroadcastsMock(): Promise<YouTubeChannelBroadcast[]> {
  return [
    {
      youtubeBroadcastId: "mock-ext-bc-001",
      title: "PARTIDO MOCK EXTERNO: RIVAS B vs ALCOBENDAS | OK Liga Plata",
      description: "Emisión programada directamente en YouTube Studio de manera externa.",
      scheduledStart: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      privacyStatus: "unlisted",
      lifeCycleStatus: "ready",
      boundStreamId: "mock-stream-id-1234",
      actualStart: null,
      actualEnd: null,
      watchUrl: "https://www.youtube.com/watch?v=mock-ext-bc-001",
      shareUrl: "https://youtube.com/live/mock-ext-bc-001?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-ext-bc-001",
      rawStatus: { lifeCycleStatus: "ready", privacyStatus: "unlisted" },
      rawContentDetails: { boundStreamId: "mock-stream-id-1234" },
    },
    {
      youtubeBroadcastId: "mock-ext-bc-002",
      title: "MOCK EXTERNO SIN ASIGNAR: RIVAS A vs BARCELONA",
      description: "Directo creado en YouTube Studio directamente.",
      scheduledStart: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      privacyStatus: "public",
      lifeCycleStatus: "ready",
      boundStreamId: "mock-stream-id-5678",
      actualStart: null,
      actualEnd: null,
      watchUrl: "https://www.youtube.com/watch?v=mock-ext-bc-002",
      shareUrl: "https://youtube.com/live/mock-ext-bc-002?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-ext-bc-002",
      rawStatus: { lifeCycleStatus: "ready", privacyStatus: "public" },
      rawContentDetails: { boundStreamId: "mock-stream-id-5678" },
    }
  ];
}

export async function listYouTubeChannelStreamsMock(): Promise<YouTubeChannelStream[]> {
  return [
    {
      youtubeLiveStreamId: "mock-stream-id-1234",
      title: "Stream Key Rivas 1",
      youtubeChannelId: "mock-channel-id",
      ingestionAddress: "rtmps://a.rtmp.youtube.com/live2",
      backupIngestionAddress: "rtmps://b.rtmp.youtube.com/live2",
      streamName: "rtmp-stream-key-value-1234",
      streamStatus: "active",
      healthStatus: "good",
      healthIssues: [],
      isReusable: true,
      rawStatus: { streamStatus: "active" },
    },
    {
      youtubeLiveStreamId: "mock-stream-id-5678",
      title: "Stream Key Rivas 2",
      youtubeChannelId: "mock-channel-id",
      ingestionAddress: "rtmps://a.rtmp.youtube.com/live2",
      backupIngestionAddress: "rtmps://b.rtmp.youtube.com/live2",
      streamName: "rtmp-stream-key-value-5678",
      streamStatus: "active",
      healthStatus: "good",
      healthIssues: [],
      isReusable: true,
      rawStatus: { streamStatus: "active" },
    }
  ];
}

export async function listYouTubeChannelBroadcasts(): Promise<YouTubeChannelBroadcast[]> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return listYouTubeChannelBroadcastsMock();
  }

  const youtube = getYoutubeClient();
  const result = await youtube.liveBroadcasts.list({
    part: ["id", "snippet", "status", "contentDetails"],
    mine: true,
    maxResults: 50,
  });

  return (result.data.items ?? []).map((item) => ({
    youtubeBroadcastId: item.id ?? "",
    title: item.snippet?.title ?? "Sin titulo",
    description: item.snippet?.description ?? null,
    scheduledStart: item.snippet?.scheduledStartTime ?? null,
    privacyStatus: item.status?.privacyStatus ?? null,
    lifeCycleStatus: item.status?.lifeCycleStatus ?? null,
    boundStreamId: item.contentDetails?.boundStreamId ?? null,
    actualStart: ((item as unknown as { actualStartTime?: string }).actualStartTime) ?? null,
    actualEnd: ((item as unknown as { actualEndTime?: string }).actualEndTime) ?? null,
    watchUrl: `https://www.youtube.com/watch?v=${item.id ?? ""}`,
    shareUrl: `https://youtube.com/live/${item.id ?? ""}?feature=share`,
    embedUrl: `https://www.youtube.com/embed/${item.id ?? ""}`,
    rawStatus: (item.status as unknown as Record<string, unknown>) ?? {},
    rawContentDetails: (item.contentDetails as unknown as Record<string, unknown>) ?? {},
  })).filter((item) => Boolean(item.youtubeBroadcastId));
}

export async function listYouTubeChannelStreams(): Promise<YouTubeChannelStream[]> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return listYouTubeChannelStreamsMock();
  }

  const youtube = getYoutubeClient();
  const result = await youtube.liveStreams.list({
    part: ["id", "snippet", "cdn", "status", "contentDetails"],
    mine: true,
    maxResults: 50,
  });

  return (result.data.items ?? [])
    .map((item) => ({
      youtubeLiveStreamId: item.id ?? "",
      title: item.snippet?.title ?? "YouTube Stream",
      youtubeChannelId: item.snippet?.channelId ?? null,
      ingestionAddress: item.cdn?.ingestionInfo?.ingestionAddress ?? null,
      backupIngestionAddress: item.cdn?.ingestionInfo?.backupIngestionAddress ?? null,
      streamName: item.cdn?.ingestionInfo?.streamName ?? null,
      streamStatus: item.status?.streamStatus ?? null,
      healthStatus: item.status?.healthStatus?.status ?? null,
      healthIssues: (item.status?.healthStatus?.configurationIssues as Array<Record<string, unknown>> | undefined) ?? [],
      isReusable: item.contentDetails?.isReusable ?? true,
      rawStatus: (item.status as unknown as Record<string, unknown>) ?? {},
    }))
    .filter((item) => Boolean(item.youtubeLiveStreamId));
}

export async function listYouTubeChannelPlaylists(): Promise<YouTubeChannelPlaylist[]> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return [];
  }

  const youtube = getYoutubeClient();
  const result = await youtube.playlists.list({
    part: ["id", "snippet", "status", "contentDetails"],
    mine: true,
    maxResults: 50,
  });

  return (result.data.items ?? [])
    .map((item) => ({
      youtubePlaylistId: item.id ?? "",
      title: item.snippet?.title ?? "Playlist",
      description: item.snippet?.description ?? null,
      youtubeChannelId: item.snippet?.channelId ?? null,
      privacyStatus: item.status?.privacyStatus ?? null,
      itemCount: item.contentDetails?.itemCount ?? null,
    }))
    .filter((item) => Boolean(item.youtubePlaylistId));
}

export async function endYouTubeBroadcast(input: { youtubeBroadcastId: string }) {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return { ok: true };
  }

  const youtube = getYoutubeClient();
  await youtube.liveBroadcasts.transition({
    part: ["id", "status", "snippet"],
    id: input.youtubeBroadcastId,
    broadcastStatus: "complete",
  });

  return { ok: true };
}

export async function updateYouTubePlaylist(input: {
  youtubePlaylistId: string;
  title: string;
  description: string;
}) {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return { ok: true };
  }

  const youtube = getYoutubeClient();
  await youtube.playlists.update({
    part: ["snippet"],
    requestBody: {
      id: input.youtubePlaylistId,
      snippet: {
        title: input.title,
        description: input.description,
      },
    },
  });

  return { ok: true };
}

export async function deleteYouTubePlaylist(input: { youtubePlaylistId: string }) {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return { ok: true };
  }

  const youtube = getYoutubeClient();
  await youtube.playlists.delete({ id: input.youtubePlaylistId });
  return { ok: true };
}

export async function updateYouTubeLiveStreamTitle(input: {
  youtubeLiveStreamId: string;
  title: string;
}) {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return { ok: true };
  }

  const youtube = getYoutubeClient();
  const existing = await youtube.liveStreams.list({
    part: ["id", "snippet", "cdn", "contentDetails"],
    id: [input.youtubeLiveStreamId],
    maxResults: 1,
  });

  const item = existing.data.items?.[0];
  if (!item?.id || !item.cdn?.frameRate || !item.cdn?.resolution || !item.cdn?.ingestionType) {
    throw new Error("No se pudo leer la stream key en YouTube para actualizarla.");
  }

  await youtube.liveStreams.update({
    part: ["snippet", "cdn", "contentDetails"],
    requestBody: {
      id: item.id,
      snippet: {
        title: input.title,
        description: item.snippet?.description ?? "",
      },
      cdn: {
        frameRate: item.cdn.frameRate,
        resolution: item.cdn.resolution,
        ingestionType: item.cdn.ingestionType,
      },
      contentDetails: {
        isReusable: item.contentDetails?.isReusable ?? true,
      },
    },
  });

  return { ok: true };
}

export async function deleteYouTubeLiveStream(input: { youtubeLiveStreamId: string }) {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return { ok: true };
  }

  const youtube = getYoutubeClient();
  await youtube.liveStreams.delete({ id: input.youtubeLiveStreamId });
  return { ok: true };
}

export async function deleteYouTubeBroadcast(input: { youtubeBroadcastId: string }) {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return { ok: true };
  }

  const youtube = getYoutubeClient();
  await youtube.liveBroadcasts.delete({
    id: input.youtubeBroadcastId,
  });
  return { ok: true };
}

export type SyncedYouTubeVideo = {
  youtubeVideoId: string;
  title: string;
  description: string | null;
  publishedAt: string;
  videoType: "video" | "live" | "short";
  watchUrl: string;
  shareUrl: string;
  embedUrl: string;
  playlistIds: string[];
};

function parseISO8601DurationToSeconds(durationStr: string): number {
  const match = durationStr.match(/P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseInt(match[4] || "0", 10);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export async function listYouTubeChannelVideosMock(): Promise<SyncedYouTubeVideo[]> {
  return [
    {
      youtubeVideoId: "mock-vid-001",
      title: "1ª AUT. MASCULINA: EL CASAR - RIVAS 8/03/2026",
      description: "Vídeo completo de la victoria del primer equipo masculino en El Casar.",
      publishedAt: "2026-03-08T11:00:00Z",
      videoType: "live",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-001",
      shareUrl: "https://youtube.com/live/mock-vid-001?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-001",
      playlistIds: ["mock-playlist-1"],
    },
    {
      youtubeVideoId: "mock-vid-002",
      title: "FINAL 4 -- 1ª AUT. FEMENINA: LAS ROZAS A - RIVAS A",
      description: "Gran partido de las chicas en la Final Four disputada contra Las Rozas A.",
      publishedAt: "2026-03-08T12:30:00Z",
      videoType: "live",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-002",
      shareUrl: "https://youtube.com/live/mock-vid-002?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-002",
      playlistIds: ["mock-playlist-2"],
    },
    {
      youtubeVideoId: "mock-vid-003",
      title: "ENTRENAMIENTO JUVENIL A - TÁCTICAS RÁPIDAS",
      description: "Vídeo de entrenamiento técnico explicando jugadas ensayadas del Juvenil A.",
      publishedAt: "2026-04-12T16:00:00Z",
      videoType: "video",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-003",
      shareUrl: "https://youtube.com/live/mock-vid-003?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-003",
      playlistIds: [],
    },
    {
      youtubeVideoId: "mock-vid-004",
      title: "GOLAZO DESDE EL CENTRO DE LA PISTA #shorts",
      description: "Vaya trallazo por la escuadra en el último segundo del Infantil B #shorts #hockey",
      publishedAt: "2026-05-10T19:30:00Z",
      videoType: "short",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-004",
      shareUrl: "https://youtube.com/live/mock-vid-004?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-004",
      playlistIds: [],
    },
    {
      youtubeVideoId: "mock-vid-005",
      title: "SUB-17 FEMENINO: RIVAS A - ALAMEDA O. 15/03/2026",
      description: "Partido completo de la categoría Sub-17 femenino en Rivas.",
      publishedAt: "2026-03-15T13:30:00Z",
      videoType: "live",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-005",
      shareUrl: "https://youtube.com/live/mock-vid-005?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-005",
      playlistIds: ["mock-playlist-1"],
    },
    {
      youtubeVideoId: "mock-vid-006",
      title: "MEJORES JUGADAS DE LA OK LIGA PLATA SUR - MAYO 2026",
      description: "Recopilación de goles, paradas y jugadas espectaculares del club este mes.",
      publishedAt: "2026-05-20T21:00:00Z",
      videoType: "video",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-006",
      shareUrl: "https://youtube.com/live/mock-vid-006?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-006",
      playlistIds: ["mock-playlist-2"],
    },
    {
      youtubeVideoId: "mock-vid-007",
      title: "CÓMO COLOCARSE LOS PATINES EN 30 SEGUNDOS #shorts",
      description: "Consejo rápido para los más pequeños de la escuela sobre cómo atar los patines #shorts",
      publishedAt: "2026-05-24T10:00:00Z",
      videoType: "short",
      watchUrl: "https://www.youtube.com/watch?v=mock-vid-007",
      shareUrl: "https://youtube.com/live/mock-vid-007?feature=share",
      embedUrl: "https://www.youtube.com/embed/mock-vid-007",
      playlistIds: [],
    }
  ];
}

export async function listYouTubeChannelVideos(): Promise<SyncedYouTubeVideo[]> {
  if (serverEnv.YOUTUBE_MOCK_MODE === "true") {
    return listYouTubeChannelVideosMock();
  }

  const youtube = getYoutubeClient();

  // 1. Get channel playlists items to map video IDs to playlists
  const playlistItemsMap = new Map<string, string[]>();
  try {
    const playlistsRes: any = await youtube.playlists.list({
      part: ["id"],
      mine: true,
      maxResults: 50,
    });
    
    for (const playlist of playlistsRes.data.items ?? []) {
      const playlistId = playlist.id;
      if (!playlistId) continue;
      
      try {
        const itemsRes: any = await youtube.playlistItems.list({
          part: ["contentDetails"],
          playlistId: playlistId,
          maxResults: 50,
        });
        
        for (const item of itemsRes.data.items ?? []) {
          const videoId = item.contentDetails?.videoId;
          if (videoId) {
            const list = playlistItemsMap.get(videoId) ?? [];
            if (!list.includes(playlistId)) {
              list.push(playlistId);
            }
            playlistItemsMap.set(videoId, list);
          }
        }
      } catch (err) {
        console.error(`Failed to list items for playlist ${playlistId}:`, err);
      }
    }
  } catch (err) {
    console.error("Failed to list playlists for mapping:", err);
  }

  // 2. Get uploads playlist ID of the channel
  const channelsResponse = await youtube.channels.list({
    part: ["contentDetails"],
    mine: true,
  });

  const uploadsPlaylistId = channelsResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("No se pudo obtener la playlist de subidas del canal de YouTube.");
  }

  // 3. Fetch the recent uploads (up to 100 items - 2 pages of 50)
  const videoItems: any[] = [];
  let nextPageToken: string | undefined = undefined;

  for (let i = 0; i < 2; i++) {
    const playlistItemsResponse: any = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });

    const items = playlistItemsResponse.data.items ?? [];
    videoItems.push(...items);

    nextPageToken = playlistItemsResponse.data.nextPageToken ?? undefined;
    if (!nextPageToken) break;
  }

  if (videoItems.length === 0) {
    return [];
  }

  // 4. Fetch full details (duration, live status) in chunks of 50
  const videoIds = videoItems.map((item) => item.contentDetails?.videoId).filter(Boolean);
  const detailedVideos: any[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const videosResponse = await youtube.videos.list({
      part: ["snippet", "contentDetails", "liveStreamingDetails"],
      id: chunk,
    });
    detailedVideos.push(...(videosResponse.data.items ?? []));
  }

  // 5. Map and classify
  return detailedVideos.map((item) => {
    const videoId = item.id ?? "";
    const isLive = Boolean(item.liveStreamingDetails);
    let videoType: "video" | "live" | "short" = "video";

    if (isLive) {
      videoType = "live";
    } else {
      const durationStr = item.contentDetails?.duration ?? ""; // e.g. PT45S
      const seconds = parseISO8601DurationToSeconds(durationStr);
      if (seconds > 0 && seconds <= 60) {
        videoType = "short";
      }
    }

    return {
      youtubeVideoId: videoId,
      title: item.snippet?.title ?? "Sin titulo",
      description: item.snippet?.description ?? null,
      publishedAt: item.snippet?.publishedAt ?? new Date().toISOString(),
      videoType,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      shareUrl: `https://youtube.com/live/${videoId}?feature=share`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      playlistIds: playlistItemsMap.get(videoId) ?? [],
    };
  });
}
