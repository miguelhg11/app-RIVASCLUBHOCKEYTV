import Link from "next/link";
import { listMyBroadcasts } from "@/src/lib/broadcast/queries";

export default async function BroadcastListPage() {
  const broadcasts = await listMyBroadcasts();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Programaciones pendientes</h1>
      <ul className="mt-4 space-y-2">
        {broadcasts.map((broadcast) => (
          <li key={broadcast.id} className="rounded border border-white/10 bg-white/[0.03] p-3 text-sm">
            <p className="font-semibold">{broadcast.title}</p>
            <p className="text-text-muted">{new Date(broadcast.scheduled_start).toLocaleString()}</p>
            <p className="text-text-muted">Sync: {broadcast.youtube_sync_status}</p>
            <div className="mt-2 flex gap-3">
              <Link className="text-accent-cyan underline" href={`/dashboard/broadcasts/${broadcast.id}/success`}>
                Ver detalle
              </Link>
              {broadcast.youtube_watch_url ? (
                <a className="text-accent-cyan underline" href={broadcast.youtube_watch_url} target="_blank" rel="noreferrer">
                  Abrir en YouTube
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
