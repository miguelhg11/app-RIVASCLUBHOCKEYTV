"use client";

import { useActionState } from "react";
import { createThumbnailBackgroundAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function ThumbnailBackgroundCreateForm() {
  const [state, formAction, pending] = useActionState(createThumbnailBackgroundAction, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Nuevo fondo de miniatura</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input required name="name" placeholder="Nombre" className="glass-card rounded-lg px-4 py-3" />
        <input required name="urlPath" placeholder="/images/fondo.png" className="glass-card rounded-lg px-4 py-3" />
      </div>
      <button type="submit" disabled={pending} className="mt-3 btn-primary rounded-lg px-4 py-2 text-xs">
        {pending ? "Guardando..." : "Crear fondo"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
