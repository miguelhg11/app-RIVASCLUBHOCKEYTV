"use client";

import { useActionState } from "react";
import { createStreamKeyAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function StreamKeyCreateForm() {
  const [state, formAction, pending] = useActionState(createStreamKeyAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <h2 className="font-display text-sm font-semibold tracking-wide text-white">Nueva stream key</h2>
      <div>
        <input
          required
          name="name"
          placeholder="Nombre identificativo"
          className="glass-input w-full rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      <p className="text-[10px] leading-relaxed text-text-muted">
        YouTube ID, stream key y RTMP se generan automáticamente al crear.
      </p>
      <button type="submit" disabled={pending} className="btn-primary w-full rounded-lg px-4 py-2 text-xs">
        {pending ? "Creando..." : "Crear stream key"}
      </button>
      {state.error ? <p className="text-xs text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="text-xs text-emerald-400">{state.ok}</p> : null}
    </form>
  );
}
