import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth/guards";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { AnalyticsDashboard } from "@/src/components/admin/analytics-dashboard";
import { listCategories, listTeams } from "@/src/lib/admin/queries";

export default async function AdminStatsPage() {
  await requireAdmin();

  const supabase = getSupabaseServerClient();

  // Fetch broadcasts, categories and teams in parallel
  const [appBroadcastsRes, externalBroadcastsRes, categories, teams] = await Promise.all([
    supabase
      .from("broadcasts")
      .select("youtube_broadcast_id, title, scheduled_start, team_id, teams(category_id)")
      .not("youtube_broadcast_id", "is", null)
      .is("deleted_at", null)
      .order("scheduled_start", { ascending: false }),
    supabase
      .from("youtube_external_broadcasts")
      .select("youtube_watch_url, title, scheduled_start")
      .not("youtube_watch_url", "is", null)
      .order("scheduled_start", { ascending: false }),
    listCategories(),
    listTeams(),
  ]);

  const appBroadcasts = appBroadcastsRes.data || [];
  const externalBroadcasts = externalBroadcastsRes.data || [];

  // Map external broadcasts
  const mappedExternals = externalBroadcasts.map((ext) => {
    let videoId = "";
    try {
      const url = new URL(ext.youtube_watch_url!);
      if (url.searchParams.has("v")) {
        videoId = url.searchParams.get("v")!;
      } else {
        videoId = url.pathname.split("/").pop() || "";
      }
    } catch {
      videoId = ext.youtube_watch_url?.split("v=").pop()?.split("&")[0] || "";
    }

    return {
      youtubeBroadcastId: videoId,
      title: `[Externo] ${ext.title}`,
      scheduledStart: ext.scheduled_start,
      teamId: "",
      categoryId: "",
    };
  }).filter(item => Boolean(item.youtubeBroadcastId));

  // Map app broadcasts including teamId and categoryId
  const mappedApp = appBroadcasts.map((b: any) => {
    // b.teams could be an array or a single object based on supabase schema relation
    const teamObj = Array.isArray(b.teams) ? b.teams[0] : b.teams;
    return {
      youtubeBroadcastId: b.youtube_broadcast_id!,
      title: b.title,
      scheduledStart: b.scheduled_start,
      teamId: b.team_id || "",
      categoryId: teamObj?.category_id || "",
    };
  });

  // Combine and sort (newest first)
  const allVideos = [...mappedApp, ...mappedExternals].sort((a, b) => {
    const dateA = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0;
    const dateB = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">
          AUDITORÍA Y ESTADÍSTICAS DEL CANAL
        </h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
          Analítica geográfica y técnica en tiempo real para detectar accesos de rivales
        </p>
      </div>

      <AnalyticsDashboard 
        initialVideos={allVideos} 
        categories={categories}
        teams={teams}
      />

      <div className="mt-6 text-sm">
        <Link href="/admin" className="text-accent-cyan hover:underline transition-all">
          ← Volver a Admin
        </Link>
      </div>
    </div>
  );
}
