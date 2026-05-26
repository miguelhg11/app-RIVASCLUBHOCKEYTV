import Link from "next/link";
import { listCachedChannelVideosAdmin } from "@/src/lib/broadcast/queries";
import { listPlaylists } from "@/src/lib/admin/queries";
import { EventLinksList } from "@/src/components/admin/event-links-list";

export default async function AdminEventLinksPage() {
  const [videos, playlists] = await Promise.all([
    listCachedChannelVideosAdmin(),
    listPlaylists(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">
          BUSCADOR CONTENIDOS
        </h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
          Búsqueda y acceso rápido a directos, vídeos y shorts del canal
        </p>
      </div>

      <EventLinksList videos={videos} playlists={playlists} />

      <div className="mt-6 text-sm">
        <Link href="/admin" className="text-accent-cyan hover:underline transition-all">
          ← Volver a Admin
        </Link>
      </div>
    </div>
  );
}
