import Link from "next/link";
import { listMyBroadcasts } from "@/src/lib/broadcast/queries";
import { DeleteBroadcastButton } from "@/src/components/forms/delete-broadcast-button";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { YouTubeShareButton } from "@/src/components/ui/youtube-share-button";
import { ReactiveSyncHandler } from "@/src/components/ui/reactive-sync-handler";

export default async function BroadcastListPage() {
  const broadcasts = await listMyBroadcasts();

  return (
    <div className="space-y-6">
      <ReactiveSyncHandler />
      <div className="border-b border-white/10 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">
          PROGRAMACIONES PENDIENTES
        </h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
          Tus directos programados y pendientes
        </p>
      </div>

      {broadcasts.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-text-muted text-sm">
          No tienes programaciones pendientes. Puedes crear un directo desde el formulario principal.
        </div>
      ) : (
        <ul className="space-y-3">
          {broadcasts.map((broadcast) => (
            <li key={broadcast.id} className="glass-panel rounded-xl p-4 text-sm hover:bg-white/[0.01] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white text-base">{broadcast.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span>📅 {new Date(broadcast.scheduled_start).toLocaleString()}</span>
                    <span>Sync: {broadcast.youtube_sync_status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Link className="text-accent-cyan hover:underline text-xs" href={`/dashboard/broadcasts/${broadcast.id}/success`}>
                    Ver detalle
                  </Link>
                  {broadcast.youtube_watch_url ? (
                    <YouTubeWatchButton href={broadcast.youtube_watch_url} size="sm" />
                  ) : null}
                  {(broadcast.youtube_share_url || broadcast.youtube_watch_url) ? (
                    <YouTubeShareButton href={broadcast.youtube_share_url || broadcast.youtube_watch_url} size="sm" />
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/broadcasts/${broadcast.id}/edit`}
                    className="rounded border border-accent-cyan bg-accent-cyan/5 px-2.5 py-1 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/15 transition-all"
                  >
                    Editar
                  </Link>
                  <DeleteBroadcastButton id={broadcast.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
