"use client";

import { useState } from "react";
import { StreamKeyEditForm } from "./stream-key-edit-form";
import { StreamKeyDeleteForm } from "./stream-key-delete-form";
import { ActiveToggleForm } from "./active-toggle-form";

type StreamKeyRow = {
  id: string;
  name: string;
  youtube_live_stream_id: string;
  stream_key: string;
  rtmp_url: string;
  active: boolean;
};

type TeamStreamKeyAssignmentsMap = Record<string, string[]>;

function maskStreamKey(value: string) {
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}

export function StreamKeysList({
  keys,
  assignments,
}: {
  keys: StreamKeyRow[];
  assignments: TeamStreamKeyAssignmentsMap;
}) {
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [search, setSearch] = useState("");

  const filteredKeys = keys.filter((keyRow) => {
    const teams = assignments[keyRow.id] || [];
    const isAssigned = teams.length > 0;

    // Filter by tab
    if (filter === "assigned" && !isAssigned) return false;
    if (filter === "unassigned" && isAssigned) return false;

    // Filter by search text
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchName = keyRow.name.toLowerCase().includes(query);
      const matchStreamId = keyRow.youtube_live_stream_id.toLowerCase().includes(query);
      const matchTeam = teams.some((t) => t.toLowerCase().includes(query));
      return matchName || matchStreamId || matchTeam;
    }

    return true;
  });

  // Grouping/Sorting: Assigned first, then unassigned
  const sortedKeys = [...filteredKeys].sort((a, b) => {
    const aTeams = assignments[a.id] || [];
    const bTeams = assignments[b.id] || [];
    if (aTeams.length > 0 && bTeams.length === 0) return -1;
    if (aTeams.length === 0 && bTeams.length > 0) return 1;
    return b.name.localeCompare(a.name); // Secondary sorting by name desc (or fallback)
  });

  return (
    <section className="mt-6 glass-panel rounded-xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Stream keys ({sortedKeys.length})</h2>

        {/* Búsqueda rápida */}
        <input
          type="text"
          placeholder="Buscar por nombre o equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-64"
        />
      </div>

      {/* Tabs de Filtro */}
      <div className="mt-4 flex gap-2 border-b border-white/8 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-accent-red text-white"
              : "bg-slate-850 text-text-muted hover:bg-white/5"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("assigned")}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            filter === "assigned"
              ? "bg-accent-red text-white"
              : "bg-slate-850 text-text-muted hover:bg-white/5"
          }`}
        >
          Asignados
        </button>
        <button
          onClick={() => setFilter("unassigned")}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            filter === "unassigned"
              ? "bg-accent-red text-white"
              : "bg-slate-850 text-text-muted hover:bg-white/5"
          }`}
        >
          Sin Asignar / Libres
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {sortedKeys.length === 0 ? (
          <p className="text-xs text-text-muted py-4 text-center">No se encontraron claves de emisión con estos filtros.</p>
        ) : (
          sortedKeys.map((keyRow) => {
            const assignedTeams = assignments[keyRow.id] || [];
            const hasTeam = assignedTeams.length > 0;

            return (
              <li key={keyRow.id} className="rounded border border-white/10 bg-black/30 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-white">{keyRow.name}</strong>

                      {/* Badge de Active */}
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-3xs font-semibold border ${
                          keyRow.active
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                            : "bg-white/[0.03] text-text-muted border-white/8"
                        }`}
                      >
                        {keyRow.active ? "Activo" : "Inactivo"}
                      </span>

                      {/* Chips de Equipos */}
                      {hasTeam ? (
                        <span className="inline-flex items-center rounded bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 text-3xs font-semibold text-accent-cyan">
                          {assignedTeams[0]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-rose-950/30 border border-rose-900/30 px-2 py-0.5 text-3xs font-semibold text-accent-red">
                          Sin asignar / Eventos
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-0.5 text-xs text-text-muted">
                      <p>
                        <span className="text-text-muted/70">YouTube Stream ID:</span> {keyRow.youtube_live_stream_id}
                      </p>
                      <p>
                        <span className="text-text-muted/70">Clave:</span> <code className="bg-white/[0.03] px-1 py-0.2 rounded text-text-muted">{maskStreamKey(keyRow.stream_key)}</code>
                      </p>
                      <p className="truncate max-w-xl">
                        <span className="text-text-muted/70">RTMP URL:</span> <span className="text-text-muted font-mono">{keyRow.rtmp_url}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <ActiveToggleForm target="stream_key" id={keyRow.id} active={keyRow.active} />
                    <StreamKeyDeleteForm id={keyRow.id} />
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-900 pt-3">
                  <p className="text-3xs text-text-muted/70 uppercase tracking-wider font-semibold mb-1">Editar campos locales / YouTube</p>
                  <StreamKeyEditForm
                    id={keyRow.id}
                    name={keyRow.name}
                    youtubeLiveStreamId={keyRow.youtube_live_stream_id}
                    streamKey={keyRow.stream_key}
                    rtmpUrl={keyRow.rtmp_url}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
