"use client";

import { useActionState, useState } from "react";
import { updateTeamAction } from "@/src/actions/admin.actions";

type Option = {
  id: string;
  name: string;
};

const initialState = {} as { error?: string; ok?: string };

export function TeamEditForm({
  id,
  categoryId,
  name,
  displayName,
  letter,
  categories,
  streamKeys = [],
  playlists = [],
  assignedStreamKeyIds = [],
  assignedPlaylistIds = [],
}: {
  id: string;
  categoryId: string;
  name: string;
  displayName: string | null;
  letter: "A" | "B" | "C" | "D" | null;
  categories: Option[];
  streamKeys?: Option[];
  playlists?: Option[];
  assignedStreamKeyIds?: string[];
  assignedPlaylistIds?: string[];
}) {
  const [state, formAction, pending] = useActionState(updateTeamAction, initialState);
  const [showResources, setShowResources] = useState(false);

  return (
    <form action={formAction} className="mt-2 bg-white/[0.03]/60 p-3 rounded border border-white/8">
      <input type="hidden" name="id" value={id} />
      
      <div className="grid gap-2 text-xs sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-text-muted">Nombre equipo</span>
          <input name="name" defaultValue={name} className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 focus:border-accent-cyan focus:outline-none" />
        </label>

        <label className="block">
          <span className="mb-1 block text-text-muted">Nombre visible</span>
          <input name="displayName" defaultValue={displayName ?? ""} placeholder="Nombre visible" className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 focus:border-accent-cyan focus:outline-none" />
        </label>

        <label className="block">
          <span className="mb-1 block text-text-muted">Categoría</span>
          <select name="categoryId" defaultValue={categoryId} className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 focus:border-accent-cyan focus:outline-none">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-text-muted">Letra</span>
          <select name="letter" defaultValue={letter ?? "none"} className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 focus:border-accent-cyan focus:outline-none">
            <option value="none">Sin letra</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </label>
      </div>

      {/* Panel colapsable de recursos del equipo */}
      {(streamKeys.length > 0 || playlists.length > 0) && (
        <div className="mt-3 border-t border-white/8 pt-2.5">
          <button
            type="button"
            onClick={() => setShowResources(!showResources)}
            className="flex items-center gap-1 text-[11px] text-accent-cyan font-semibold hover:underline focus:outline-none"
          >
            {showResources ? "▲ Ocultar asignación de recursos" : `▼ Editar recursos asignados (${assignedStreamKeyIds.length} keys, ${assignedPlaylistIds.length} playlists)`}
          </button>

          {showResources && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2 bg-black/30/40 p-2.5 rounded border border-white/8/80">
              {/* Checkboxes de Stream Keys */}
              <div>
                <span className="mb-1.5 block text-[10px] font-semibold text-text-muted uppercase tracking-wider">Asignar Claves de emisión</span>
                {streamKeys.length === 0 ? (
                  <p className="text-3xs text-text-muted/70">No hay stream keys disponibles.</p>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto bg-black/30 p-2 rounded border border-white/8">
                    {streamKeys.map((key) => {
                      const isChecked = assignedStreamKeyIds.includes(key.id);
                      return (
                        <label key={key.id} className="flex items-center gap-2 text-3xs text-text-muted cursor-pointer select-none">
                          <input
                            type="checkbox"
                            name="streamKeyIds"
                            value={key.id}
                            defaultChecked={isChecked}
                            className="accent-cyan-500"
                          />
                          <span>{key.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1 text-[9px] text-text-muted/70 leading-tight">Nota: Al asignar una clave a este equipo, se desvinculará de cualquier otro equipo.</p>
              </div>

              {/* Checkboxes de Playlists */}
              <div>
                <span className="mb-1.5 block text-[10px] font-semibold text-text-muted uppercase tracking-wider">Asignar Playlists</span>
                {playlists.length === 0 ? (
                  <p className="text-3xs text-text-muted/70">No hay playlists activas sincronizadas.</p>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto bg-black/30 p-2 rounded border border-white/8">
                    {playlists.map((playlist) => {
                      const isChecked = assignedPlaylistIds.includes(playlist.id);
                      return (
                        <label key={playlist.id} className="flex items-center gap-2 text-3xs text-text-muted cursor-pointer select-none">
                          <input
                            type="checkbox"
                            name="playlistIds"
                            value={playlist.id}
                            defaultChecked={isChecked}
                            className="accent-cyan-500"
                          />
                          <span>{playlist.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent-red px-3 py-1.5 text-3xs font-medium text-white disabled:opacity-50 hover:bg-accent-red/80 transition-colors"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        {state.error ? <span className="text-accent-red text-3xs">{state.error}</span> : null}
        {state.ok ? <span className="text-emerald-300 text-3xs">{state.ok}</span> : null}
      </div>
    </form>
  );
}
