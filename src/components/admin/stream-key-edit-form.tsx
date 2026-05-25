"use client";

import { useActionState } from "react";
import { updateStreamKeyAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

export function StreamKeyEditForm({
  id,
  name,
  youtubeLiveStreamId,
  streamKey,
  rtmpUrl,
}: {
  id: string;
  name: string;
  youtubeLiveStreamId: string;
  streamKey: string;
  rtmpUrl: string;
}) {
  const [state, formAction, pending] = useActionState(updateStreamKeyAction, initialState);

  return (
    <form action={formAction} className="mt-3 grid gap-2 text-xs sm:grid-cols-5">
      <input type="hidden" name="id" value={id} />
      <input name="name" defaultValue={name} className="glass-input rounded-lg px-2 py-1.5" placeholder="Nombre" />
      <input name="youtubeLiveStreamId" defaultValue={youtubeLiveStreamId} className="glass-input rounded-lg px-2 py-1.5" placeholder="YouTube ID" />
      <input name="streamKey" defaultValue={streamKey} className="glass-input rounded-lg px-2 py-1.5" placeholder="Stream key" />
      <input name="rtmpUrl" defaultValue={rtmpUrl} className="glass-input rounded-lg px-2 py-1.5" placeholder="RTMP URL" />
      <button type="submit" disabled={pending} className="btn-ghost rounded-lg px-2 py-1.5 text-[10px] uppercase tracking-wider">
        {pending ? "Guardando..." : "Guardar"}
      </button>
      {state.error ? <span className="text-accent-red sm:col-span-4">{state.error}</span> : null}
    </form>
  );
}
