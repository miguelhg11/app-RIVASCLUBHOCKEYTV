"use client";

import { useActionState } from "react";
import { createPlaylistAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function PlaylistCreateForm() {
  const [state, formAction, pending] = useActionState(createPlaylistAction, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Nueva playlist</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input required name="name" placeholder="Nombre" className="glass-card rounded-lg px-4 py-3" />
        <textarea
          name="description"
          placeholder="Descripcion"
          className="sm:col-span-2 glass-card rounded-lg px-4 py-3"
          rows={3}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted">El ID de YouTube se crea automaticamente al guardar.</p>
      <button type="submit" disabled={pending} className="mt-3 btn-primary rounded-lg px-4 py-2 text-xs">
        {pending ? "Guardando..." : "Crear playlist"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
