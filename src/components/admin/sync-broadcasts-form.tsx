"use client";

import { useActionState } from "react";
import { syncChannelBroadcastsAction, type SyncBroadcastState } from "@/src/actions/broadcast.actions";

const initialState: SyncBroadcastState = {};

export function SyncBroadcastsForm() {
  const [state, formAction, pending] = useActionState(syncChannelBroadcastsAction, initialState);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Sync canal YouTube -&gt; App</h2>
      <p className="mt-1 text-xs text-text-muted">Importa o actualiza stream keys, playlists y broadcasts del canal en la base de datos.</p>
      <button type="submit" disabled={pending} className="mt-3 btn-primary rounded-lg px-4 py-2 text-xs">
        {pending ? "Sincronizando..." : "Sincronizar ahora"}
      </button>
      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
