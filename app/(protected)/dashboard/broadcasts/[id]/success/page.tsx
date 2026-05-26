import { getBroadcastForSuccessPage } from "@/src/lib/broadcast/queries";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";

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

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Directo creado</h1>
      <div className="mt-4 space-y-2 glass-panel rounded-xl p-5 text-sm">
        <p>
          <strong>Titulo:</strong> {broadcast.title}
        </p>
        <p className="flex items-center gap-3">
          <strong>URL YouTube:</strong>{" "}
          {broadcast.youtube_watch_url ? (
            <YouTubeWatchButton href={broadcast.youtube_watch_url} size="sm" />
          ) : (
            "-"
          )}
        </p>
        <p>
          <strong>RTMP URL:</strong> {stream?.rtmp_url ?? "-"}
        </p>
        <p>
          <strong>Stream key:</strong> {stream?.stream_key ?? "-"}
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
