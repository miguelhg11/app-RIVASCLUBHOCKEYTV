import Link from "next/link";
import { listFinishedEventsAdminGlobal } from "@/src/lib/user/queries";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { ShareLinkButton } from "@/src/components/ui/share-link-button";
import { DeleteBroadcastButton } from "@/src/components/forms/delete-broadcast-button";

export default async function AdminFinishedBroadcastsPage() {
  const rows = await listFinishedEventsAdminGlobal();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">ADMIN · PROGRAMACIONES FINALIZADAS</h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">Histórico global de emisiones finalizadas</p>
      </div>

      {rows.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-text-muted text-sm">No hay emisiones finalizadas registradas.</div>
      ) : (
        <div className="glass-panel rounded-xl p-4">
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <details key={row.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <summary className="list-none cursor-pointer">
                  <p className="font-semibold text-white">{row.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{new Date(row.scheduledStart).toLocaleString()} · {row.teamName}</p>
                </summary>
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-xs text-text-muted mb-2">Creador: {row.creatorName || "-"}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {row.youtubeWatchUrl ? <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" /> : null}
                    {(row.youtubeShareUrl || row.youtubeWatchUrl) ? (
                      <ShareLinkButton href={row.youtubeShareUrl || row.youtubeWatchUrl || ""} title={row.title} />
                    ) : null}
                    <DeleteBroadcastButton id={row.id} />
                  </div>
                </div>
              </details>
            ))}
          </div>
          <div className="hidden overflow-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-text-muted">
                <th className="px-3 py-2.5">Título</th>
                <th className="px-3 py-2.5">Equipo</th>
                <th className="px-3 py-2.5">Creador</th>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5">Enlaces</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5 align-middle hover:bg-white/[0.01] transition-all">
                  <td className="px-3 py-3 font-medium text-white">{row.title}</td>
                  <td className="px-3 py-3 text-text-muted">{row.teamName}</td>
                  <td className="px-3 py-3 text-text-muted">{row.creatorName || "-"}</td>
                  <td className="px-3 py-3 text-text-muted">{new Date(row.scheduledStart).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {row.youtubeWatchUrl ? <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" /> : null}
                      {(row.youtubeShareUrl || row.youtubeWatchUrl) ? (
                        <ShareLinkButton href={row.youtubeShareUrl || row.youtubeWatchUrl || ""} title={row.title} />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right"><DeleteBroadcastButton id={row.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm">
        <Link href="/admin" className="text-accent-cyan hover:underline transition-all">← Volver a Admin</Link>
      </div>
    </div>
  );
}
