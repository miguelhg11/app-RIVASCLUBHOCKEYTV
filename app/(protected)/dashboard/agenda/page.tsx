import { getBroadcastFormResourcesForCurrentUser, getTeamResourcesMap, getActiveThumbnailBackgrounds } from "@/src/lib/user/queries";
import { NewBroadcastForm } from "@/src/components/forms/new-broadcast-form";
import { getCategorizedBadges } from "@/src/lib/thumbnails/resolver";

export default async function AgendaPage({
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
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Agenda competiciones</h1>
      <p className="mt-2 text-sm text-text-muted">Selecciona un partido y pulsa Programar emision para generar la programacion.</p>

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
          Puedes ver la agenda, pero para completar una programacion necesitas equipo, stream key y playlist asignados.
        </section>
      ) : null}

      <NewBroadcastForm
        key={`agenda-${initialMatchId}`}
        mode="agenda"
        agendaOnly
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
