"use client";

import { useActionState } from "react";
import { updateTeamStreamKeyAssignmentAction } from "@/src/actions/admin.actions";

type Option = { id: string; label: string };

const initialState = {} as { error?: string; ok?: string };

export function TeamStreamKeyAssignmentForm({
  teams,
  streamKeys,
}: {
  teams: Option[];
  streamKeys: Option[];
}) {
  const [state, formAction, pending] = useActionState(updateTeamStreamKeyAssignmentAction, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Asignar stream key a equipo</h2>
      <p className="mt-1 text-xs text-text-muted">
        Nota: Cada stream key es exclusiva. Al asignarla a un equipo, se desvinculará automáticamente de cualquier otro equipo al que estuviera asociada previamente.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Equipo</span>
          <select name="teamId" required className="w-full glass-input rounded-lg px-3 py-2 text-sm outline-none pr-8">
            <option value="">Selecciona equipo</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Stream key</span>
          <select name="streamKeyId" required className="w-full glass-input rounded-lg px-3 py-2 text-sm outline-none pr-8">
            <option value="">Selecciona stream key</option>
            {streamKeys.map((streamKey) => (
              <option key={streamKey.id} value={streamKey.id}>{streamKey.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Accion</span>
          <select name="mode" className="w-full glass-input rounded-lg px-3 py-2 text-sm outline-none pr-8">
            <option value="assign">Asignar</option>
            <option value="unassign">Desasignar</option>
          </select>
        </label>
      </div>

      <button type="submit" disabled={pending} className="mt-3 btn-primary rounded-lg px-4 py-2 text-xs">
        {pending ? "Guardando..." : "Aplicar"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
