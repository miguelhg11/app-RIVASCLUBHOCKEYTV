"use client";

import { useActionState } from "react";
import { deleteBroadcastAction } from "@/src/actions/broadcast.actions";

export function DeleteBroadcastButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteBroadcastAction, {});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar por completo esta programación? Esto borrará el directo local y lo removerá de la API de YouTube.")) {
      e.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-accent-red-soft bg-accent-red-soft px-2.5 py-1 text-xs font-semibold text-accent-red hover:bg-accent-red/20 disabled:opacity-50 transition-all"
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </button>
      {state.error && <p className="text-[10px] text-accent-red mt-1">{state.error}</p>}
    </form>
  );
}
