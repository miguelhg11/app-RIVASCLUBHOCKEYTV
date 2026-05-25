"use client";

import { useActionState, useState } from "react";
import { createTeamAction } from "@/src/actions/admin.actions";

type Option = {
  id: string;
  name: string;
};

const initialState = {} as { error?: string; ok?: string };

export function TeamCreateForm({
  categories,
  streamKeys = [],
  playlists = [],
}: {
  categories: Option[];
  streamKeys?: Option[];
  playlists?: Option[];
}) {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);
  const [showResources, setShowResources] = useState(false);
  const hasCategories = categories.length > 0;

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Nuevo equipo</h2>
      {!hasCategories ? (
        <p className="mt-2 text-sm text-amber-300">
          No hay categorias creadas. Crea una categoria en Admin &gt; Categorias antes de crear equipos.
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Categoria</span>
          <select name="categoryId" required className="w-full glass-card rounded-lg px-4 py-3 focus:border-accent-cyan focus:outline-none">
            <option value="">Selecciona categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Letra (opcional)</span>
          <select name="letter" className="w-full glass-card rounded-lg px-4 py-3 focus:border-accent-cyan focus:outline-none">
            <option value="none">Sin letra</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Nombre equipo</span>
          <input name="name" placeholder="Se autogenera si se deja vacio" className="w-full glass-card rounded-lg px-4 py-3 focus:border-accent-cyan focus:outline-none" />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-text-muted">Nombre visible</span>
          <input name="displayName" className="w-full glass-card rounded-lg px-4 py-3 focus:border-accent-cyan focus:outline-none" />
        </label>
      </div>

      {/* Sección colapsable de recursos */}
      {hasCategories && (streamKeys.length > 0 || playlists.length > 0) && (
        <div className="mt-4 border-t border-white/8 pt-3">
          <button
            type="button"
            onClick={() => setShowResources(!showResources)}
            className="flex items-center gap-1 text-xs text-accent-cyan font-semibold hover:underline focus:outline-none"
          >
            {showResources ? "▲ Ocultar asignación de recursos" : "▼ Mostrar asignación de recursos (Stream keys y Playlists)"}
          </button>

          {showResources && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 bg-black/30/30 p-3 rounded border border-white/8">
              {/* Checkboxes de Stream Keys */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-text-muted uppercase tracking-wider">Asignar Claves de emisión</span>
                {streamKeys.length === 0 ? (
                  <p className="text-3xs text-text-muted/70">No hay stream keys activas creadas.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto bg-black/30 p-2 rounded border border-white/8">
                    {streamKeys.map((key) => (
                      <label key={key.id} className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
                        <input type="checkbox" name="streamKeyIds" value={key.id} className="accent-cyan-500" />
                        <span>{key.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[10px] text-text-muted/70">Nota: Al asignar una clave a este equipo, se desvinculará de cualquier otro equipo.</p>
              </div>

              {/* Checkboxes de Playlists */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-text-muted uppercase tracking-wider">Asignar Playlists</span>
                {playlists.length === 0 ? (
                  <p className="text-3xs text-text-muted/70">No hay playlists activas sincronizadas.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto bg-black/30 p-2 rounded border border-white/8">
                    {playlists.map((playlist) => (
                      <label key={playlist.id} className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
                        <input type="checkbox" name="playlistIds" value={playlist.id} className="accent-cyan-500" />
                        <span>{playlist.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !hasCategories}
        className="mt-4 btn-primary rounded-lg px-4 py-2 text-xs disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Crear equipo"}
      </button>

      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
