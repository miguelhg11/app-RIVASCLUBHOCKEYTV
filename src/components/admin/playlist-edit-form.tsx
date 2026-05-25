"use client";

import { useActionState } from "react";
import { updatePlaylistAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function PlaylistEditForm({
  id,
  name,
  youtubePlaylistId,
  description,
}: {
  id: string;
  name: string;
  youtubePlaylistId: string;
  description: string | null;
}) {
  const [state, formAction, pending] = useActionState(updatePlaylistAction, initialState);

  return (
    <form action={formAction} className="mt-2 grid gap-2 text-xs sm:grid-cols-4">
      <input type="hidden" name="id" value={id} />
      <input name="name" defaultValue={name} className="rounded border border-white/10 bg-black/30 px-2 py-1" />
      <input name="youtubePlaylistId" defaultValue={youtubePlaylistId} className="rounded border border-white/10 bg-black/30 px-2 py-1" />
      <input name="description" defaultValue={description ?? ""} className="rounded border border-white/10 bg-black/30 px-2 py-1" />
      <button type="submit" disabled={pending} className="rounded border border-white/10 px-2 py-1">
        Guardar
      </button>
      {state.error ? <span className="text-accent-red sm:col-span-3">{state.error}</span> : null}
    </form>
  );
}
