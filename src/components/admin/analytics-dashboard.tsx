/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

type VideoItem = {
  youtubeBroadcastId: string;
  title: string;
  scheduledStart: string | null;
  teamId: string;
  categoryId: string;
};

type ProvinceStat = {
  code: string;
  name: string;
  views: number;
  percentage: number;
};

type DeviceStat = {
  type: string;
  views: number;
  percentage: number;
};

type AnalyticsData = {
  views: number;
  estimatedMinutesWatched: number;
  provincias: ProvinceStat[];
  devices: DeviceStat[];
  concurrentViewers: number | null;
};

type FilterProp = {
  id: string;
  name: string;
};

export function AnalyticsDashboard({
  initialVideos,
  categories,
  teams,
}: {
  initialVideos: VideoItem[];
  categories: FilterProp[];
  teams: FilterProp[];
}) {
  // Filter States
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Filter logic on client-side
  const filteredVideos = useMemo(() => {
    return initialVideos.filter((video) => {
      // Category filter
      if (filterCategory && video.categoryId !== filterCategory) {
        return false;
      }
      // Team filter
      if (filterTeam && video.teamId !== filterTeam) {
        return false;
      }
      // Date range filter
      if (video.scheduledStart) {
        const videoDate = video.scheduledStart.split("T")[0];
        if (filterFrom && videoDate < filterFrom) {
          return false;
        }
        if (filterTo && videoDate > filterTo) {
          return false;
        }
      } else if (filterFrom || filterTo) {
        // Exclude videos with no date if a date filter is active
        return false;
      }
      return true;
    });
  }, [initialVideos, filterCategory, filterTeam, filterFrom, filterTo]);

  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Derive selection
  const effectiveSelectedVideoId = useMemo(() => {
    if (filteredVideos.length === 0) return "";
    const stillExists = filteredVideos.some((v) => v.youtubeBroadcastId === selectedVideoId);
    return stillExists ? selectedVideoId : filteredVideos[0].youtubeBroadcastId;
  }, [filteredVideos, selectedVideoId]);

  const fetchAnalytics = useCallback(async (videoId: string) => {
    if (!videoId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/youtube/analytics/${videoId}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Error al obtener analíticas");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de red al consultar estadísticas.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever effective selection changes
  useEffect(() => {
    fetchAnalytics(effectiveSelectedVideoId);
  }, [effectiveSelectedVideoId, fetchAnalytics]);


  return (
    <div className="space-y-6">
      {/* Panel de Filtros */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Filtros de Búsqueda
        </h3>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium">
            <span className="mb-1 block text-text-muted">Categoría</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full glass-card rounded-lg px-3 py-2 text-xs text-white border border-white/10 bg-black/40 focus:border-accent-cyan outline-none"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900">
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium">
            <span className="mb-1 block text-text-muted">Equipo</span>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="w-full glass-card rounded-lg px-3 py-2 text-xs text-white border border-white/10 bg-black/40 focus:border-accent-cyan outline-none"
            >
              <option value="">Todos los equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id} className="bg-neutral-900">
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium">
            <span className="mb-1 block text-text-muted">Desde</span>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full glass-card rounded-lg px-3 py-2 text-xs text-white border border-white/10 bg-black/40 focus:border-accent-cyan outline-none"
            />
          </label>

          <label className="text-xs font-medium">
            <span className="mb-1 block text-text-muted">Hasta</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full glass-card rounded-lg px-3 py-2 text-xs text-white border border-white/10 bg-black/40 focus:border-accent-cyan outline-none"
            />
          </label>
        </div>
      </div>

      {/* Selector de Vídeo */}
      <div className="glass-panel p-5 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <label className="block text-sm font-semibold text-text-muted uppercase tracking-wider">
              Seleccionar Partido / Emisión ({filteredVideos.length})
            </label>
            <select
              value={effectiveSelectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full glass-card rounded-lg px-4 py-3 text-white border border-white/10 bg-black/40 focus:border-accent-cyan outline-none transition-colors"
            >
              {filteredVideos.length === 0 ? (
                <option value="">No hay partidos que coincidan con los filtros</option>
              ) : (
                filteredVideos.map((video) => (
                  <option key={video.youtubeBroadcastId} value={video.youtubeBroadcastId} className="bg-neutral-900 text-white">
                    {video.title} {video.scheduledStart ? `(${new Date(video.scheduledStart).toLocaleDateString("es-ES")})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
          {effectiveSelectedVideoId && !loading && !error && data && (
            <div className="flex items-end self-end sm:self-auto sm:pt-6">
              <a
                href={`/api/admin/reports/event-analytics/${effectiveSelectedVideoId}`}
                className="rounded border border-accent-cyan px-4 py-3 font-medium text-accent-cyan hover:bg-accent-cyan/10 transition-colors whitespace-nowrap text-xs"
              >
                Descargar Reporte PDF
              </a>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-cyan"></div>
          <span className="mt-4 text-sm text-text-muted">Cargando analíticas en tiempo real...</span>
        </div>
      )}

      {error && (
        <div className="glass-panel p-6 rounded-xl border border-red-500/20 bg-red-950/10 space-y-2">
          <h4 className="text-red-400 font-semibold text-lg">Error de Conexión</h4>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6 animate-fadeIn">

          {/* Tarjetas Principales */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-panel p-5 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Visualizaciones (Clics)</span>
              <div className="text-3xl font-bold text-white">{data.views}</div>
              <p className="text-2xs text-text-muted">Clics totales en enlaces de tracking</p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tiempo Reproducido</span>
              <div className="text-3xl font-bold text-white">{data.estimatedMinutesWatched} min</div>
              <p className="text-2xs text-text-muted">Estimado acumulado</p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Retención Media</span>
              <div className="text-3xl font-bold text-white">
                {data.views > 0
                  ? (data.estimatedMinutesWatched / data.views).toFixed(1)
                  : "0"} min
              </div>
              <p className="text-2xs text-text-muted">Promedio estimado por usuario</p>
            </div>

            <div className="glass-panel p-5 rounded-xl space-y-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Espectadores en Vivo</span>
              <div className={`text-3xl font-bold ${data.concurrentViewers !== null ? "text-red-500 animate-pulse" : "text-white"}`}>
                {data.concurrentViewers !== null ? data.concurrentViewers : "-"}
              </div>
              <p className="text-2xs text-text-muted">
                {data.concurrentViewers !== null ? "Directo activo ahora en YouTube" : "Evento finalizado / programado"}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Panel de Localidades */}
            <div className="glass-panel p-5 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide">Ubicación Geográfica (Localidades / Ciudades)</h3>
              <p className="text-xs text-text-muted">
                Muestra los municipios exactos desde donde acceden los espectadores en tiempo real.
              </p>

              <div className="space-y-3">
                {data.provincias.length === 0 ? (
                  <p className="text-sm text-text-muted">No hay datos de ubicación disponibles para este vídeo.</p>
                ) : (
                  data.provincias.map((prov) => (
                    <div key={prov.code} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">{prov.name}</span>
                        <span className="text-text-muted">{prov.views} visitas ({prov.percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-accent-cyan transition-all duration-500"
                          style={{ width: `${prov.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel de Dispositivos */}
            <div className="glass-panel p-5 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white tracking-wide">Tipos de Dispositivo</h3>
              <p className="text-xs text-text-muted">
                Muestra la procedencia técnica del tráfico. Útil para entender cómo consume el contenido la audiencia.
              </p>

              <div className="space-y-3">
                {data.devices.length === 0 ? (
                  <p className="text-sm text-text-muted">No hay datos de dispositivos disponibles para este vídeo.</p>
                ) : (
                  data.devices.map((dev) => (
                    <div key={dev.type} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">{dev.type}</span>
                        <span className="text-text-muted">{dev.views} visitas ({dev.percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${dev.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
