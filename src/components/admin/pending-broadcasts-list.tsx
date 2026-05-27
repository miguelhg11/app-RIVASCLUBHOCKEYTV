"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { EndBroadcastForm } from "./end-broadcast-form";
import { deleteBroadcastAction } from "@/src/actions/broadcast.actions";
import type { PendingBroadcastAdminRow, UnassignedExternalBroadcastRow } from "@/src/lib/broadcast/queries";
import type { UserRow, TeamRow } from "@/src/lib/admin/queries";

import { YouTubeWatchButton } from "@/src/components/ui/youtube-watch-button";
import { YouTubeShareButton } from "@/src/components/ui/youtube-share-button";

function DeleteBroadcastButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteBroadcastAction, {});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar por completo esta programación? Esto borrará el directo local y lo removerá de la API de YouTube.")) {
      e.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-accent-red-soft bg-accent-red-soft px-2.5 py-1 text-xs font-semibold text-accent-red hover:bg-accent-red/20 disabled:opacity-50 transition-all"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
      {state.error && <p className="text-[10px] text-accent-red mt-1">{state.error}</p>}
    </form>
  );
}

type Props = {
  initialBroadcasts: PendingBroadcastAdminRow[];
  unassignedBroadcasts: UnassignedExternalBroadcastRow[];
  users: UserRow[];
  teams: TeamRow[];
};

export function PendingBroadcastsList({ initialBroadcasts, unassignedBroadcasts, users, teams }: Props) {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [now] = useState(() => Date.now());

  const filteredBroadcasts = initialBroadcasts.filter((bc) => {
    const matchUser = selectedUser === "all" || bc.createdBy === selectedUser;
    const matchTeam = selectedTeam === "all" || bc.teamId === selectedTeam;
    return matchUser && matchTeam;
  });

  return (
    <div className="space-y-6">
      {/* Filters Container */}
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/2">
          <label htmlFor="user-filter" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Filtrar por Usuario / Creador
          </label>
          <select
            id="user-filter"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="all">Todos los usuarios</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-1/2">
          <label htmlFor="team-filter" className="block text-xs font-semibold tracking-wider text-text-muted uppercase mb-1.5">
            Filtrar por Equipo
          </label>
          <select
            id="team-filter"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="all">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.display_name || t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Broadcasts Table */}
      <section className="glass-panel rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">
              Programaciones Pendientes ({filteredBroadcasts.length})
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Schedules that have not completed yet (auto-expires after 24h).
            </p>
          </div>
        </div>

        {filteredBroadcasts.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No hay programaciones pendientes que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <>
          <div className="mt-3 space-y-3 md:hidden">
            {filteredBroadcasts.map((row) => {
              const canEnd = row.youtubeLifeCycleStatus === "live" || row.youtubeLifeCycleStatus === "testing" || row.youtubeLifeCycleStatus === "ready";
              const scheduledDate = new Date(row.scheduledStart);
              const expiresTime = scheduledDate.getTime() + 24 * 60 * 60 * 1000;
              const msLeft = expiresTime - now;
              const hoursLeft = Math.max(0, Math.floor(msLeft / (60 * 60 * 1000)));
              const isExpired = msLeft <= 0;

              return (
                <details key={row.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <summary className="list-none cursor-pointer">
                    <p className="font-semibold text-white">{row.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{scheduledDate.toLocaleString()} · {row.teamDisplayName || row.teamName}</p>
                  </summary>
                  <div className="mt-3 border-t border-white/10 pt-3 space-y-2 text-xs text-text-muted">
                    <p>Creador: {row.creatorName || "-"} ({row.creatorEmail})</p>
                    <p>Estado live: {row.youtubeLifeCycleStatus} · Sync: {row.youtubeSyncStatus}</p>
                    <p>{isExpired ? "Expirando..." : `Expira en ${hoursLeft}h`}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {row.youtubeWatchUrl ? <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" /> : null}
                      {row.youtubeShareUrl ? <YouTubeShareButton href={row.youtubeShareUrl} size="sm" /> : null}
                      <Link
                        href={`/dashboard/broadcasts/${row.id}/edit`}
                        className="rounded border border-accent-cyan bg-accent-cyan/5 px-2.5 py-1 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/15 transition-all"
                      >
                        Editar
                      </Link>
                      <EndBroadcastForm id={row.id} disabled={!canEnd} />
                      <DeleteBroadcastButton id={row.id} />
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
                  <th className="px-3 py-2.5">Fecha Programada</th>
                  <th className="px-3 py-2.5">Equipo</th>
                  <th className="px-3 py-2.5">Creador</th>
                  <th className="px-3 py-2.5">Estado Live</th>
                  <th className="px-3 py-2.5">Estado Sync</th>
                  <th className="px-3 py-2.5 text-center">URLs</th>
                  <th className="px-3 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBroadcasts.map((row) => {
                  const canEnd = row.youtubeLifeCycleStatus === "live" || row.youtubeLifeCycleStatus === "testing" || row.youtubeLifeCycleStatus === "ready";
                  const scheduledDate = new Date(row.scheduledStart);
                  
                  // Calculate time until expiration
                  const expiresTime = scheduledDate.getTime() + 24 * 60 * 60 * 1000;
                  const msLeft = expiresTime - now;
                  const hoursLeft = Math.max(0, Math.floor(msLeft / (60 * 60 * 1000)));
                  const isExpired = msLeft <= 0;

                  return (
                    <tr key={row.id} className="border-b border-white/5 align-top hover:bg-white/[0.01] transition-all">
                      <td className="px-3 py-3 font-medium text-white">{row.title}</td>
                      <td className="px-3 py-3 text-text-muted">
                        <div>{scheduledDate.toLocaleString()}</div>
                        <div className="mt-0.5 text-[10px] uppercase font-semibold">
                          {isExpired ? (
                            <span className="text-accent-red">Expirando...</span>
                          ) : (
                            <span className="text-accent-cyan">Expira en {hoursLeft}h</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-text-muted">{row.teamDisplayName || row.teamName}</td>
                      <td className="px-3 py-3 text-text-muted">
                        <div>{row.creatorName || "-"}</div>
                        <div className="text-[10px] text-text-muted/60">{row.creatorEmail}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          row.youtubeLifeCycleStatus === "live"
                            ? "bg-accent-red-soft text-accent-red ring-accent-red/30"
                            : "bg-white/5 text-text-muted ring-white/10"
                        }`}>
                          {row.youtubeLifeCycleStatus === "live" && (
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-accent-red live-dot" />
                          )}
                          {row.youtubeLifeCycleStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-text-muted">{row.youtubeSyncStatus}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {row.youtubeWatchUrl ? (
                            <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" />
                          ) : null}
                          {row.youtubeShareUrl ? (
                            <YouTubeShareButton href={row.youtubeShareUrl} size="sm" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Link
                            href={`/dashboard/broadcasts/${row.id}/edit`}
                            className="rounded border border-accent-cyan bg-accent-cyan/5 px-2.5 py-1 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/15 transition-all"
                          >
                            Editar
                          </Link>
                          <EndBroadcastForm id={row.id} disabled={!canEnd} />
                          <DeleteBroadcastButton id={row.id} />
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

      {/* External Broadcasts Table */}
      <section className="glass-panel rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">
              Emisiones Externas sin Asignar ({unassignedBroadcasts.length})
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Directos programados directamente en YouTube Studio que no están vinculados en la app.
            </p>
          </div>
        </div>

        {unassignedBroadcasts.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No hay emisiones externas sin asignar.
          </div>
        ) : (
          <>
          <div className="mt-3 space-y-3 md:hidden">
            {unassignedBroadcasts.map((row) => {
              const scheduledDate = row.scheduledStart ? new Date(row.scheduledStart) : null;
              return (
                <details key={row.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <summary className="list-none cursor-pointer">
                    <p className="font-semibold text-white">{row.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{scheduledDate ? scheduledDate.toLocaleString() : "Sin fecha"}</p>
                  </summary>
                  <div className="mt-3 border-t border-white/10 pt-3 space-y-2 text-xs text-text-muted">
                    <p>Estado: {row.youtubeLifeCycleStatus}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {row.youtubeWatchUrl ? <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" /> : null}
                      {row.youtubeShareUrl ? <YouTubeShareButton href={row.youtubeShareUrl} size="sm" /> : null}
                      <Link
                        href={`/admin/broadcasts/assign/${row.id}`}
                        className="inline-flex items-center rounded-md bg-accent-cyan/10 px-2.5 py-1 text-xs font-semibold text-accent-cyan ring-1 ring-inset ring-accent-cyan/20 hover:bg-accent-cyan/20 transition-all"
                      >
                        Asignar Equipo
                      </Link>
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
                  <th className="px-3 py-2.5">Fecha Programada</th>
                  <th className="px-3 py-2.5">Estado Live</th>
                  <th className="px-3 py-2.5 text-center">URLs</th>
                  <th className="px-3 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {unassignedBroadcasts.map((row) => {
                  const scheduledDate = row.scheduledStart ? new Date(row.scheduledStart) : null;
                  return (
                    <tr key={row.id} className="border-b border-white/5 align-top hover:bg-white/[0.01] transition-all">
                      <td className="px-3 py-3 font-medium text-white">{row.title}</td>
                      <td className="px-3 py-3 text-text-muted">
                        {scheduledDate ? scheduledDate.toLocaleString() : "Sin fecha"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center rounded-md bg-white/5 px-1.5 py-0.5 text-xs font-medium text-text-muted ring-1 ring-inset ring-white/10">
                          {row.youtubeLifeCycleStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {row.youtubeWatchUrl && (
                            <YouTubeWatchButton href={row.youtubeWatchUrl} size="sm" />
                          )}
                          {row.youtubeShareUrl && (
                            <YouTubeShareButton href={row.youtubeShareUrl} size="sm" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/admin/broadcasts/assign/${row.id}`}
                          className="inline-flex items-center rounded-md bg-accent-cyan/10 px-2.5 py-1 text-xs font-semibold text-accent-cyan ring-1 ring-inset ring-accent-cyan/20 hover:bg-accent-cyan/20 transition-all"
                        >
                          Asignar Equipo
                        </Link>
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
