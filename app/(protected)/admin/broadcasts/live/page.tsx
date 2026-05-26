import Link from "next/link";
import { listLiveBroadcastsForSession } from "@/src/lib/broadcast/queries";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { ShareLinkButton } from "@/src/components/ui/share-link-button";
import { EndBroadcastForm } from "@/src/components/admin/end-broadcast-form";

export default async function AdminLiveBroadcastsPage() {
  const broadcasts = await listLiveBroadcastsForSession("global");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">ADMIN · PROGRAMACIONES LIVE</h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">Emisiones en directo de todo el canal</p>
      </div>

      {broadcasts.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-text-muted text-sm">No hay emisiones en directo en este momento.</div>
      ) : (
        <ul className="space-y-3">
          {broadcasts.map((row) => (
            <li key={row.id} className="glass-panel rounded-xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white text-base">{row.title}</p>
                  <p className="mt-1 text-xs text-text-muted">📅 {new Date(row.scheduledStart).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {row.youtubeWatchUrl ? <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" /> : null}
                  {(row.youtubeShareUrl || row.youtubeWatchUrl) ? (
                    <ShareLinkButton href={row.youtubeShareUrl || row.youtubeWatchUrl || ""} title={row.title} />
                  ) : null}
                  <EndBroadcastForm id={row.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 text-sm">
        <Link href="/admin" className="text-accent-cyan hover:underline transition-all">← Volver a Admin</Link>
      </div>
    </div>
  );
}
