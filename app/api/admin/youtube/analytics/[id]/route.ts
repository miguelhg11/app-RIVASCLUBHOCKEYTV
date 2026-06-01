import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth/session";
import { ROLES } from "@/src/lib/auth/roles";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { getYouTubeLiveConcurrentViewers, getYouTubeVideoAnalytics } from "@/src/lib/youtube/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.role !== ROLES.admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID de vídeo no especificado" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // broadcast_analytics records can be stored with either:
    //   a) the YouTube video ID (e.g. "qfzx79blzYo") — when tracking link was /r/youtubeId
    //   b) the Supabase broadcast UUID — when tracking link was /r/UUID (route resolved it but saved UUID)
    // We need to search by both to get all tracking records.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Determine all possible IDs we should search analytics by
    const searchIds: string[] = [id];

    if (!uuidRegex.test(id)) {
      // id is a YouTube video ID — also find the Supabase UUID for this broadcast
      const { data: bcRow } = await supabase
        .from("broadcasts")
        .select("id")
        .eq("youtube_broadcast_id", id)
        .maybeSingle();
      if (bcRow?.id) {
        searchIds.push(bcRow.id);
      }
    } else {
      // id is a UUID — also find the YouTube video ID for this broadcast
      const { data: bcRow } = await supabase
        .from("broadcasts")
        .select("youtube_broadcast_id")
        .eq("id", id)
        .maybeSingle();
      if (bcRow?.youtube_broadcast_id) {
        searchIds.push(bcRow.youtube_broadcast_id);
      }
    }

    // Query click tracking history directly from Supabase for real-time city-level granularity
    // and fetch official YouTube Analytics API stats
    // We use the YouTube video ID (not UUID) for YouTube API calls
    const youtubeVideoId = uuidRegex.test(id) ? (searchIds[1] || id) : id;

    const [dbRes, concurrentViewers, ytAnalytics] = await Promise.all([
      supabase
        .from("broadcast_analytics")
        .select("city, region, country, device_type")
        .in("broadcast_id", searchIds),
      getYouTubeLiveConcurrentViewers(youtubeVideoId),
      getYouTubeVideoAnalytics(youtubeVideoId).catch((err) => {
        console.error(`Error fetching YouTube Analytics API for ${youtubeVideoId}:`, err);
        return null; // Return null so we fall back entirely to local tracking
      })
    ]);

    if (dbRes.error) {
      throw dbRes.error;
    }

    const records = dbRes.data || [];
    const totalLocalViews = records.length;
    const estimatedLocalMinutesWatched = totalLocalViews * 12;

    // Group and aggregate by City
    const cityCounts: Record<string, { count: number; region: string }> = {};
    // Group and aggregate by Device Type
    const deviceCounts: Record<string, number> = {};

    // 1. Populate with local tracking database records
    for (const r of records) {
      const cityName = r.city || "Desconocido";
      if (!cityCounts[cityName]) {
        cityCounts[cityName] = { count: 0, region: r.region || "" };
      }
      cityCounts[cityName].count++;

      const devName = r.device_type || "ORDENADOR";
      deviceCounts[devName] = (deviceCounts[devName] || 0) + 1;
    }

    // 2. Aggregate official YouTube Analytics API data if available
    if (ytAnalytics) {
      for (const p of ytAnalytics.provincias) {
        const cityName = p.name || "Desconocido";
        if (!cityCounts[cityName]) {
          cityCounts[cityName] = { count: 0, region: p.code };
        }
        cityCounts[cityName].count += p.views;
      }
      for (const d of ytAnalytics.devices) {
        const devName = d.type || "ORDENADOR";
        deviceCounts[devName] = (deviceCounts[devName] || 0) + d.views;
      }
    }

    const totalAggregatedViewsForProvinces = Object.values(cityCounts).reduce((acc, c) => acc + c.count, 0);
    const totalAggregatedViewsForDevices = Object.values(deviceCounts).reduce((acc, c) => acc + c, 0);

    const provincias = Object.entries(cityCounts).map(([name, val]) => ({
      code: name, // Using name as code for coloring rules in dashboard
      name: name,
      views: val.count,
      percentage: totalAggregatedViewsForProvinces > 0 ? Math.round((val.count / totalAggregatedViewsForProvinces) * 100) : 0
    })).sort((a, b) => b.views - a.views);

    const devices = Object.entries(deviceCounts).map(([type, count]) => ({
      type,
      views: count,
      percentage: totalAggregatedViewsForDevices > 0 ? Math.round((count / totalAggregatedViewsForDevices) * 100) : 0
    })).sort((a, b) => b.views - a.views);

    const finalViews = Math.max(ytAnalytics?.views || 0, totalLocalViews);
    const finalMinutes = Math.max(ytAnalytics?.estimatedMinutesWatched || 0, estimatedLocalMinutesWatched);

    return NextResponse.json({
      views: finalViews,
      estimatedMinutesWatched: finalMinutes,
      provincias,
      devices,
      concurrentViewers
    });
  } catch (error: any) {
    console.error(`Error in analytics route for video ${id}:`, error);
    return NextResponse.json(
      { error: "Error al consultar las estadísticas en tiempo real desde Supabase." },
      { status: 500 }
    );
  }
}
