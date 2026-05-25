import { PlaylistCreateForm } from "@/src/components/admin/playlist-create-form";
import { PlaylistEditForm } from "@/src/components/admin/playlist-edit-form";
import { PlaylistDeleteForm } from "@/src/components/admin/playlist-delete-form";
import { SyncBroadcastsForm } from "@/src/components/admin/sync-broadcasts-form";
import { listPlaylists } from "@/src/lib/admin/queries";

export default async function AdminPlaylistsPage() {
  const playlists = await listPlaylists();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Admin · Playlists</h1>
      <div className="mt-4">
        <SyncBroadcastsForm />
      </div>
      <div className="mt-4">
        <PlaylistCreateForm />
      </div>
      <section className="mt-4 glass-panel rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Playlists ({playlists.length})</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {playlists.map((playlist) => (
            <li key={playlist.id} className="glass-card rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p>
                  <strong>{playlist.name}</strong> · {playlist.youtube_playlist_id} · {playlist.active ? "activa" : "inactiva"}
                </p>
              </div>
              <PlaylistEditForm
                id={playlist.id}
                name={playlist.name}
                youtubePlaylistId={playlist.youtube_playlist_id}
                description={playlist.description}
              />
              <PlaylistDeleteForm id={playlist.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
