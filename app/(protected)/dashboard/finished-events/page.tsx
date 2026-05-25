import Link from "next/link";
import { listMySeasons, listMyFinishedEvents } from "@/src/lib/user/queries";
import { SeasonSelector } from "./SeasonSelector";

type SearchParams = Promise<{ seasonId?: string }>;

export default async function FinishedEventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const seasons = await listMySeasons();

  // If no seasons are found, user has never been assigned to any team in any active season.
  if (seasons.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">
            Programaciones finalizadas
          </h1>
          <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
            Historial de emisiones completadas
          </p>
        </div>

        <div className="glass-panel rounded-xl p-8 text-center text-text-muted text-sm">
          No estás vinculado a ningún equipo ni tienes participación registrada en ninguna temporada.
        </div>

        <div className="mt-6 text-sm">
          <Link href="/dashboard" className="text-accent-cyan hover:underline transition-all">
            ← Volver a Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const selectedSeasonId = params.seasonId || seasons[0].id;
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId) || seasons[0];

  const finishedEvents = await listMyFinishedEvents(selectedSeason.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">
            Programaciones finalizadas
          </h1>
          <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
            Historial de emisiones completadas y grabadas
          </p>
        </div>
        <div>
          <SeasonSelector seasons={seasons} selectedSeasonId={selectedSeason.id} />
        </div>
      </div>

      <section className="glass-panel rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase mb-4">
          Grabaciones de la Temporada {selectedSeason.name} ({finishedEvents.length})
        </h2>

        {finishedEvents.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No se encontraron eventos finalizados ni grabaciones para tus equipos en esta temporada.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-text-muted">
                  <th className="px-3 py-2.5">Partido / Título</th>
                  <th className="px-3 py-2.5">Equipo</th>
                  <th className="px-3 py-2.5">Fecha y Hora</th>
                  <th className="px-3 py-2.5">Enlace de Grabación</th>
                </tr>
              </thead>
              <tbody>
                {finishedEvents.map((event) => {
                  const date = new Date(event.scheduledStart);
                  return (
                    <tr key={event.id} className="border-b border-white/5 align-middle hover:bg-white/[0.01] transition-all">
                      <td className="px-3 py-3.5 font-medium text-white">{event.title}</td>
                      <td className="px-3 py-3.5 text-text-muted">{event.teamName}</td>
                      <td className="px-3 py-3.5 text-text-muted">{date.toLocaleString()}</td>
                      <td className="px-3 py-3.5">
                        {event.youtubeWatchUrl ? (
                          <a
                            href={event.youtubeWatchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-cyan hover:underline hover:text-white transition-all text-xs font-semibold uppercase tracking-wider"
                          >
                            Ver en YouTube ↗
                          </a>
                        ) : (
                          <span className="text-text-muted/50">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 text-sm">
        <Link href="/dashboard" className="text-accent-cyan hover:underline transition-all">
          ← Volver a Dashboard
        </Link>
      </div>
    </div>
  );
}
