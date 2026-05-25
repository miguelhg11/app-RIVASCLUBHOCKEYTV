"use client";

import { useActionState } from "react";
import { endBroadcastAction, type EndBroadcastState } from "@/src/actions/broadcast.actions";

const initialState: EndBroadcastState = {};

export function EndBroadcastForm({ id, disabled }: { id: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(endBroadcastAction, initialState);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded border border-rose-500 px-2 py-1 text-xs font-medium text-accent-red disabled:opacity-50"
      >
        {pending ? "Finalizando..." : "Finalizar emision"}
      </button>
      {state.error ? <span className="text-xs text-accent-red">{state.error}</span> : null}
      {state.ok ? <span className="text-xs text-emerald-300">{state.ok}</span> : null}
    </form>
  );
}
