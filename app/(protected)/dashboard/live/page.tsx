import { listLiveBroadcastsForSession } from "@/src/lib/broadcast/queries";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { ShareLinkButton } from "@/src/components/ui/share-link-button";
import { EndBroadcastForm } from "@/src/components/admin/end-broadcast-form";
import { ReactiveSyncHandler } from "@/src/components/ui/reactive-sync-handler";

export default async function LiveBroadcastsPage() {
  const broadcasts = await listLiveBroadcastsForSession();

  return (
    <div className="space-y-6">
      <ReactiveSyncHandler />
      <div className="rounded-2xl border border-accent-red/30 bg-accent-red/10 p-5 shadow-lg shadow-accent-red/10">
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">EMISIONES LIVE</h1>
        <p className="mt-1 text-xs tracking-widest text-accent-red uppercase animate-pulse">
          En directo ahora mismo
        </p>
      </div>

      {broadcasts.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-text-muted text-sm">
          No hay emisiones en directo en este momento.
        </div>
      ) : (
        <ul className="space-y-3">
          {broadcasts.map((broadcast) => (
            <li key={broadcast.id} className="rounded-xl border border-accent-red/25 bg-gradient-to-r from-[#2a0e12] to-[#151821] p-4 shadow-md shadow-black/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{broadcast.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span>📅 {new Date(broadcast.scheduledStart).toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-accent-red/15 px-2 py-0.5 text-accent-red ring-1 ring-accent-red/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-red live-dot" />LIVE
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {broadcast.youtubeWatchUrl ? <YouTubeWatchButton href={broadcast.youtubeWatchUrl} size="sm" /> : null}
                  {(broadcast.youtubeShareUrl || broadcast.youtubeWatchUrl) ? (
                    <ShareLinkButton
                      href={broadcast.youtubeShareUrl || broadcast.youtubeWatchUrl || ""}
                      title={broadcast.title}
                      text="Te comparto este directo de Rivas Hockey TV"
                    />
                  ) : null}
                  <EndBroadcastForm id={broadcast.id} disabled={false} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
