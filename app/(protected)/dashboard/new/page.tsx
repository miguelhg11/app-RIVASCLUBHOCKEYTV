import { getBroadcastFormResourcesForCurrentUser, getTeamResourcesMap, getActiveThumbnailBackgrounds } from "@/src/lib/user/queries";
import { NewBroadcastForm } from "@/src/components/forms/new-broadcast-form";
import { getCategorizedBadges } from "@/src/lib/thumbnails/resolver";

export default async function NewBroadcastPage({
  searchParams,
}: {
  searchParams: Promise<{ matchId?: string }>;
}) {
  const params = await searchParams;
  const initialMatchId = typeof params.matchId === "string" ? params.matchId : "";
  const [assigned, teamResourcesMap, categorizedBadges, activeBackgrounds] = await Promise.all([
    getBroadcastFormResourcesForCurrentUser(),
    getTeamResourcesMap(),
    getCategorizedBadges(),
    getActiveThumbnailBackgrounds(),
  ]);
  const hasMinimum = assigned.teams.length > 0 && assigned.streamKeys.length > 0 && assigned.playlists.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Programar manual</h1>
      <p className="mt-2 text-sm text-text-muted">
        Crea una programacion manual fuera de agenda FMP/RFEP (amistosos, torneos o eventos especiales).
      </p>

      <section className="mt-4 glass-panel rounded-xl p-5 text-sm">
        <h2 className="font-semibold">Recursos disponibles</h2>
        <p className="mt-2">Equipos: {assigned.teams.length}</p>
        <p>Stream keys: {assigned.streamKeys.length}</p>
        <p>Stream keys ocupadas: {assigned.streamKeysBlocked.length}</p>
        <p>Playlists: {assigned.playlists.length}</p>
        {assigned.isAdmin ? <p className="mt-2 text-emerald-300">Modo admin: acceso total.</p> : null}
      </section>

      {!hasMinimum ? (
        <section className="mt-4 rounded border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-100">
          Puedes ver la agenda de competiciones, pero ahora mismo no puedes finalizar una programacion porque faltan recursos
          (equipo, stream key y playlist). Pide asignacion a un admin.
        </section>
      ) : null}

      <NewBroadcastForm
        key={`manual-${initialMatchId}`}
        mode="manual"
        initialMatchId={initialMatchId}
        teams={assigned.teams}
        streamKeys={assigned.streamKeys}
        blockedStreamKeys={assigned.streamKeysBlocked}
        playlists={assigned.playlists}
        teamResourcesMap={teamResourcesMap}
        categorizedBadges={categorizedBadges}
        thumbnailBackgrounds={activeBackgrounds}
      />
    </div>
  );
}
