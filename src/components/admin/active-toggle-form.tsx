"use client";

import { useActionState } from "react";
import { setActiveStatusAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function ActiveToggleForm({
  target,
  id,
  active,
}: {
  target: "user" | "stream_key" | "playlist" | "thumbnail_background";
  id: string;
  active: boolean;
}) {
  const [_, formAction, pending] = useActionState(setActiveStatusAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5 disabled:opacity-50"
      >
        {active ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}
