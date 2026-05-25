"use client";

import { useActionState, useState } from "react";
import { createAdminUserAction } from "@/src/actions/admin.actions";

const initialState = {} as { error?: string; ok?: string };

interface ResourceItem {
  id: string;
  name: string;
}

export function UserCreateForm({
  teams,
}: {
  teams: ResourceItem[];
}) {
  const [state, formAction, pending] = useActionState(createAdminUserAction, initialState);
  const [showResources, setShowResources] = useState(false);

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-cyan/10 text-xs text-accent-cyan font-bold">1</span>
        Creación de Usuario
      </h2>
      
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Datos Personales */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-muted">Nombre completo</label>
            <input
              required
              name="name"
              placeholder="Ej. Juan Pérez"
              className="mt-1 w-full glass-card rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Email de acceso</label>
            <input
              required
              type="email"
              name="email"
              placeholder="juan@hockeyrivas.com"
              className="mt-1 w-full glass-card rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Teléfono de contacto (opcional)</label>
            <input
              name="phone"
              placeholder="+34 600 000 000"
              className="mt-1 w-full glass-card rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-accent-cyan"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted">Rol del usuario</label>
            <select
              name="role"
              defaultValue="user"
              className="mt-1 w-full glass-card rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-accent-cyan"
            >
              <option value="user">Usuario estándar</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        {/* Asignación de Recursos */}
        <div className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-muted">Asignar Equipos (Límites)</label>
            <button
              type="button"
              onClick={() => setShowResources(!showResources)}
              className="text-xs text-accent-cyan hover:underline md:hidden"
            >
              {showResources ? "Ocultar lista" : "Mostrar lista"}
            </button>
          </div>

          <div className={`mt-2 flex-1 flex flex-col ${showResources ? "" : "hidden md:flex"}`}>
            {/* Equipos */}
            <div className="flex-1 rounded border border-white/8 bg-black/30/50 p-4">
              <h3 className="text-xs font-bold text-text-muted mb-2.5">Equipos de la temporada ({teams.length})</h3>
              {teams.length === 0 ? (
                <p className="text-xs text-text-muted/70 italic">No hay equipos creados.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {teams.map((team) => (
                    <label key={team.id} className="flex items-center gap-2.5 text-xs text-text-muted hover:text-white cursor-pointer">
                      <input type="checkbox" name="teamIds" value={team.id} className="rounded border-white/10 bg-white/[0.03] text-cyan-500 focus:ring-0 focus:ring-offset-0" />
                      <span>{team.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!showResources && (
            <div className="md:hidden mt-2 p-3 text-center border border-dashed border-white/8 bg-black/30/20 rounded text-xs text-text-muted/70">
              Usa el botón de arriba para ver/asignar equipos en móviles.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
        <p className="text-xs text-text-muted">
          🔑 La contraseña de acceso se generará de manera segura tras la creación.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-red/80 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Crear y Asignar Usuario"}
        </button>
      </div>

      {state.error ? <p className="mt-3 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-3 text-sm text-emerald-300">{state.ok}</p> : null}
    </form>
  );
}
