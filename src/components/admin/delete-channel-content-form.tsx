"use client";

import { useActionState, type FormEvent } from "react";
import { deleteChannelContentAction, type DeleteChannelContentState } from "@/src/actions/broadcast.actions";

const initialState: DeleteChannelContentState = {};

export function DeleteChannelContentForm({ youtubeVideoId }: { youtubeVideoId: string }) {
  const [state, formAction, pending] = useActionState(deleteChannelContentAction, initialState);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm("¿Eliminar este contenido del canal? Esta acción borra el vídeo/directo en YouTube y no se puede deshacer.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="inline-flex items-center gap-1">
      <input type="hidden" name="youtubeVideoId" value={youtubeVideoId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-accent-red-soft bg-accent-red-soft px-2.5 py-1 text-xs font-semibold text-accent-red hover:bg-accent-red/20 disabled:opacity-50 transition-all"
      >
        {pending ? "Borrando..." : "Borrar"}
      </button>
      {state.error ? <span className="text-[10px] text-accent-red">{state.error}</span> : null}
    </form>
  );
}
