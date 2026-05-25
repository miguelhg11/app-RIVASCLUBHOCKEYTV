"use client";

import { useActionState } from "react";
import { deleteCategoryAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function CategoryDeleteForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteCategoryAction, initialState);

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-3 py-1.5 text-[10px] text-accent-red hover:bg-accent-red/20">
        {pending ? "Borrando..." : "Borrar"}
      </button>
      {state.error ? <span className="text-xs text-accent-red">{state.error}</span> : null}
      {state.ok ? <span className="text-xs text-emerald-300">{state.ok}</span> : null}
    </form>
  );
}
