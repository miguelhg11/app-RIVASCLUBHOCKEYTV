"use client";

import { useActionState } from "react";
import { updateThumbnailBackgroundAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function ThumbnailBackgroundEditForm({ id, name, urlPath }: { id: string; name: string; urlPath: string }) {
  const [state, formAction, pending] = useActionState(updateThumbnailBackgroundAction, initialState);

  return (
    <form action={formAction} className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
      <input type="hidden" name="id" value={id} />
      <input name="name" defaultValue={name} className="rounded border border-white/10 bg-black/30 px-2 py-1" />
      <input name="urlPath" defaultValue={urlPath} className="rounded border border-white/10 bg-black/30 px-2 py-1" />
      <button type="submit" disabled={pending} className="rounded border border-white/10 px-2 py-1">
        Guardar
      </button>
      {state.error ? <span className="text-accent-red sm:col-span-2">{state.error}</span> : null}
    </form>
  );
}
