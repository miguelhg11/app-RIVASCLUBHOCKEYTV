import Link from "next/link";
import { listAllSeasons, getSelectedSeason } from "@/src/lib/seasons/utils";
import { SeasonCreateForm } from "@/src/components/admin/season-create-form";

export default async function AdminSeasonsPage() {
  const seasons = await listAllSeasons();
  const currentSeason = await getSelectedSeason();

  return (
    <div className="space-y-6">
      {/* Navegación y Encabezado */}
      <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-xs text-accent-cyan hover:underline">
            Volver a Admin
          </Link>
          <span className="text-text-muted/50">/</span>
          <span className="text-xs text-text-muted font-semibold">Temporadas</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">Gestión de Temporadas</h1>
        <p className="text-sm text-text-muted">
          Visualiza los periodos dados de alta y registra nuevos años de planificación.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulario de Alta */}
        <div className="md:col-span-1">
          <SeasonCreateForm />
        </div>

        {/* Listado de Temporadas */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-panel rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center justify-between border-b border-white/8 pb-2">
              <span>Temporadas Registradas</span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-text-muted">
                {seasons.length} total
              </span>
            </h2>

            {seasons.length === 0 ? (
              <p className="text-xs text-text-muted/70 italic py-4">No hay temporadas registradas.</p>
            ) : (
              <div className="divide-y divide-white/5 space-y-2">
                {seasons.map((season) => {
                  const isCurrent = season.id === currentSeason.id;
                  return (
                    <div
                      key={season.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isCurrent
                          ? "bg-accent-cyan/10 border-accent-cyan/35"
                          : "bg-black/30/40 border-white/8/80 hover:border-white/8 hover:bg-black/30/60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{season.name}</span>
                          {isCurrent && (
                            <span className="rounded-full bg-accent-cyan/10 border border-accent-cyan/25 px-2 py-0.5 text-[9px] font-bold text-accent-cyan uppercase tracking-wide">
                              Seleccionada
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-text-muted/70 mt-0.5">
                          Periodo: Septiembre {season.start_year} - Junio {season.end_year}
                        </p>
                      </div>
                      <span className="text-[10px] text-text-muted/50">
                        {new Date(season.created_at).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
