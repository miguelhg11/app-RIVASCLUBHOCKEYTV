"use client";

import { useActionState } from "react";
import { updateCategoryAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function CategoryEditForm({ id, name, sortOrder }: { id: string; name: string; sortOrder: number }) {
  const [state, formAction, pending] = useActionState(updateCategoryAction, initialState);

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="name" defaultValue={name} className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-xs" />
      <input type="number" name="sortOrder" min={0} max={9999} defaultValue={sortOrder} className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-xs" />
      <button type="submit" disabled={pending} className="rounded border border-white/10 px-2 py-1 text-xs">
        Guardar
      </button>
      {state.error ? <span className="text-xs text-accent-red">{state.error}</span> : null}
    </form>
  );
}
