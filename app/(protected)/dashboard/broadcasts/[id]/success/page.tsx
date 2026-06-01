import { getBroadcastForSuccessPage } from "@/src/lib/broadcast/queries";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { CopyTrackingLinkButton } from "@/src/components/ui/copy-tracking-link-button";

type SuccessPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BroadcastSuccessPage({ params }: SuccessPageProps) {
  const { id } = await params;
  const broadcast = await getBroadcastForSuccessPage(id);

  if (!broadcast) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">No encontrado</h1>
        <p className="mt-2 text-sm text-text-muted">No existe el broadcast o no tienes permisos para verlo.</p>
      </div>
    );
  }

  const stream = Array.isArray(broadcast.stream_keys) ? broadcast.stream_keys[0] : broadcast.stream_keys;
  const videoIdOrUuid = broadcast.youtube_video_id || broadcast.id;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">Directo creado</h1>
      <div className="mt-4 space-y-3 glass-panel rounded-xl p-5 text-sm">
        <p>
          <strong>Título:</strong> {broadcast.title}
        </p>
        <p className="flex items-center gap-3">
          <strong>Enlace directo YouTube:</strong>{" "}
          {broadcast.youtube_watch_url ? (
            <YouTubeWatchButton href={broadcast.youtube_watch_url} size="sm" />
          ) : (
            "-"
          )}
        </p>
        {broadcast.youtube_watch_url ? (
          <div className="py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-text-muted">Comparte este enlace para poder rastrear estadísticas:</span>
            <CopyTrackingLinkButton videoIdOrUuid={videoIdOrUuid} />
          </div>
        ) : null}
        <p>
          <strong>RTMP URL:</strong> <code className="bg-black/35 px-1.5 py-0.5 rounded font-mono text-xs">{stream?.rtmp_url ?? "-"}</code>
        </p>
        <p>
          <strong>Stream key:</strong> <code className="bg-black/35 px-1.5 py-0.5 rounded font-mono text-xs">{stream?.stream_key ?? "-"}</code>
        </p>
        <p>
          <strong>Sync:</strong> {broadcast.youtube_sync_status}
        </p>
        <p>
          <strong>Miniatura:</strong> {broadcast.thumbnail_status}
        </p>
      </div>
    </div>
  );
}

