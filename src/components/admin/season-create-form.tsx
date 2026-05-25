"use client";

import { useActionState } from "react";
import { createSeasonAction } from "@/src/actions/season.actions";

const initialState = {} as { error?: string; ok?: string };

export function SeasonCreateForm() {
  const [state, formAction, pending] = useActionState(createSeasonAction, initialState);
  const currentYear = new Date().getFullYear();

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5 max-w-md">
      <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent-red"></span>
        Nueva Temporada Manual
      </h2>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-text-muted">Año de inicio</label>
          <input
            required
            type="number"
            name="startYear"
            defaultValue={currentYear}
            min={currentYear}
            placeholder={String(currentYear)}
            className="mt-1 w-full glass-card rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-accent-cyan"
          />
          <p className="mt-1 text-[10px] text-text-muted/70">
            La temporada se guardará automáticamente en formato YYYY-YYYY+1 (ej. {currentYear}-{currentYear + 1}).
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-accent-red py-2 text-sm font-semibold text-white transition hover:bg-accent-red/80 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Crear Temporada"}
        </button>
      </div>

      {state.error ? <p className="mt-3 text-xs text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-3 text-xs text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
