"use client";

import { useState } from "react";
import { CustomDatePicker } from "@/src/components/ui/custom-date-picker";
import type { CachedYouTubeVideoRow } from "@/src/lib/broadcast/queries";
import type { PlaylistRow } from "@/src/lib/admin/queries";
import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { DeleteChannelContentForm } from "@/src/components/admin/delete-channel-content-form";

type Props = {
  videos: CachedYouTubeVideoRow[];
  playlists: PlaylistRow[];
};

export function EventLinksList({ videos, playlists }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPlaylist, setSelectedPlaylist] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logic: AND combination (cumulative)
  const filteredVideos = videos.filter((video) => {
    // 1. Text Search (title matches word-by-word or complete phrase)
    const matchSearch =
      !searchTerm.trim() ||
      video.title.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Date Range Filter
    let matchDate = true;
    if (startDate || endDate) {
      const pubDateOnly = video.publishedAt.split("T")[0];
      if (startDate && pubDateOnly < startDate) {
        matchDate = false;
      }
      if (endDate && pubDateOnly > endDate) {
        matchDate = false;
      }
    }

    // 3. Type Filter
    const matchType = selectedType === "all" || video.videoType === selectedType;

    // 4. Playlist Filter
    const matchPlaylist =
      selectedPlaylist === "all" || video.playlistIds.includes(selectedPlaylist);

    return matchSearch && matchDate && matchType && matchPlaylist;
  });

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedType("all");
    setSelectedPlaylist("all");
  };

  return (
    <div className="space-y-6">
      {/* Filters Container */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Buscador y Filtros acumulativos (AND)
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Keyword Search */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
              Buscador por palabras
            </label>
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none placeholder-white/20"
            />
          </div>

          {/* Date Picker Desde */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
              Fecha desde
            </label>
            <CustomDatePicker value={startDate} onChange={setStartDate} />
          </div>

          {/* Date Picker Hasta */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
              Fecha hasta
            </label>
            <CustomDatePicker value={endDate} onChange={setEndDate} />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
              Tipo de contenido
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="all">Todos los formatos</option>
              <option value="live">Directo (Live Stream)</option>
              <option value="video">Vídeo subido</option>
              <option value="short">Short</option>
            </select>
          </div>

          {/* Playlist Selector */}
          <div>
            <label className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
              Lista de reproducción
            </label>
            <select
              value={selectedPlaylist}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="all">Todas las listas</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.youtube_playlist_id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || startDate || endDate || selectedType !== "all" || selectedPlaylist !== "all") && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleResetFilters}
              className="btn-ghost px-4 py-1.5 text-xs text-accent-cyan hover:text-white"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Videos List */}
      <section className="glass-panel rounded-xl p-5">
        <div className="border-b border-white/10 pb-3">
          <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">
            Resultados del canal ({filteredVideos.length})
          </h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Vídeos, emisiones grabadas y shorts detectados en el canal de YouTube.
          </p>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No se encontraron partidos o vídeos que coincidan con la búsqueda.
          </div>
        ) : (
          <>
          <div className="mt-3 space-y-3 md:hidden">
            {filteredVideos.map((row) => {
              const publishedDate = new Date(row.publishedAt);
              const matchedPlaylists = playlists.filter((pl) => row.playlistIds.includes(pl.youtube_playlist_id));

              return (
                <details key={row.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <summary className="list-none cursor-pointer">
                    <p className="font-semibold text-white">{row.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{publishedDate.toLocaleDateString()} · {publishedDate.toLocaleTimeString()}</p>
                  </summary>
                  <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
                    <p className="text-xs text-text-muted">Tipo: {row.videoType === "live" ? "Directo" : row.videoType === "short" ? "Short" : "Video"}</p>
                    <div className="flex flex-wrap gap-1">
                      {matchedPlaylists.length === 0 ? (
                        <span className="text-xs text-text-muted/50">Sin listas</span>
                      ) : (
                        matchedPlaylists.map((pl) => (
                          <span key={pl.id} className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-text-muted">
                            {pl.name}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopyLink(row.youtubeWatchUrl, row.id)}
                        className="btn-ghost px-2.5 py-1 text-xs text-accent-cyan"
                      >
                        {copiedId === row.id ? "¡Copiado!" : "Copiar Enlace"}
                      </button>
                      <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" />
                      <DeleteChannelContentForm youtubeVideoId={row.youtubeVideoId} />
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
          <div className="mt-3 hidden overflow-auto md:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-text-muted">
                  <th className="px-3 py-2.5">Título</th>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5">Listas de reproducción</th>
                  <th className="px-3 py-2.5 text-right">Enlaces y acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.map((row) => {
                  const publishedDate = new Date(row.publishedAt);
                  
                  // Get active playlists names this video belongs to
                  const matchedPlaylists = playlists.filter((pl) =>
                    row.playlistIds.includes(pl.youtube_playlist_id)
                  );

                  return (
                    <tr key={row.id} className="border-b border-white/5 align-top hover:bg-white/[0.01] transition-all">
                      <td className="px-3 py-4 font-medium text-white max-w-sm sm:max-w-md truncate">
                        <div className="font-semibold text-white whitespace-pre-wrap">{row.title}</div>
                        {row.description && (
                          <div className="text-xs text-text-muted/70 mt-1 line-clamp-1">
                            {row.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-text-muted whitespace-nowrap">
                        {publishedDate.toLocaleDateString()}
                        <div className="text-[10px] text-text-muted/60 mt-0.5">
                          {publishedDate.toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          row.videoType === "live"
                            ? "bg-accent-red-soft text-accent-red ring-accent-red/20"
                            : row.videoType === "short"
                            ? "bg-accent-cyan-soft text-accent-cyan ring-accent-cyan/20"
                            : "bg-white/5 text-text-muted ring-white/10"
                        }`}>
                          {row.videoType === "live" ? "Directo" : row.videoType === "short" ? "Short" : "Vídeo"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1">
                          {matchedPlaylists.length === 0 ? (
                            <span className="text-xs text-text-muted/50">-</span>
                          ) : (
                            matchedPlaylists.map((pl) => (
                              <span key={pl.id} className="inline-flex items-center rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-text-muted">
                                {pl.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleCopyLink(row.youtubeWatchUrl, row.id)}
                            className="btn-ghost px-2.5 py-1 text-xs text-accent-cyan"
                          >
                            {copiedId === row.id ? "¡Copiado!" : "Copiar Enlace"}
                          </button>
                          <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" />
                          <DeleteChannelContentForm youtubeVideoId={row.youtubeVideoId} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
