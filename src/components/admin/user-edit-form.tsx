"use client";

import { useActionState, useState } from "react";
import { updateUserAction, deleteUserAction } from "@/src/actions/admin.actions";
import { UserPasswordResetForm } from "./user-password-reset-form";

const initialUpdateState = {} as { error?: string; ok?: string };
const initialDeleteState = {} as { error?: string; ok?: string };

interface ResourceItem {
  id: string;
  name: string;
}

export function UserEditForm({
  id,
  name,
  email,
  phone,
  role,
  allTeams,
  assignedTeamIds,
}: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "user";
  allTeams: ResourceItem[];
  assignedTeamIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [updateState, updateFormAction, updatePending] = useActionState(updateUserAction, initialUpdateState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteUserAction, initialDeleteState);

  return (
    <div className="mt-2 border-t border-white/8 pt-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/5"
        >
          {isOpen ? "Cerrar Edición" : "Editar Usuario y Equipos"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 rounded-lg border border-white/8 bg-black/30 p-4 space-y-4">
          <form action={updateFormAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Datos del usuario */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Datos Personales</h4>
                <div>
                  <label className="text-[10px] font-semibold text-text-muted/70">Nombre completo</label>
                  <input
                    required
                    name="name"
                    defaultValue={name}
                    className="mt-0.5 w-full rounded border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-text-muted/70">Email de acceso</label>
                  <input
                    required
                    type="email"
                    name="email"
                    defaultValue={email}
                    className="mt-0.5 w-full rounded border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-text-muted/70">Teléfono</label>
                  <input
                    name="phone"
                    defaultValue={phone ?? ""}
                    placeholder="Ninguno"
                    className="mt-0.5 w-full rounded border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-cyan"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-text-muted/70">Rol</label>
                  <select
                    name="role"
                    defaultValue={role}
                    className="mt-0.5 w-full rounded border border-white/8 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white outline-none focus:border-accent-cyan"
                  >
                    <option value="user">Usuario estándar</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Asignación de Recursos */}
              <div className="space-y-2 flex flex-col">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Asignación de Equipos</h4>
                
                {/* Equipos */}
                <div className="flex-1 rounded border border-slate-900 bg-white/[0.03]/30 p-3">
                  <span className="text-[10px] font-bold text-text-muted block mb-2">Equipos de la temporada ({allTeams.length})</span>
                  {allTeams.length === 0 ? (
                    <p className="text-[11px] text-text-muted/50 italic">No hay equipos creados esta temporada.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {allTeams.map((team) => (
                        <label key={team.id} className="flex items-center gap-2.5 text-[11px] text-text-muted hover:text-white cursor-pointer">
                          <input
                            type="checkbox"
                            name="teamIds"
                            value={team.id}
                            defaultChecked={assignedTeamIds.includes(team.id)}
                            className="rounded border-white/8 bg-black/30 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <span>{team.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-900 pt-3">
              <button
                type="submit"
                disabled={updatePending}
                className="rounded bg-accent-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-red/80 disabled:opacity-50"
              >
                {updatePending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>

            {updateState.error ? <p className="text-xs text-accent-red">{updateState.error}</p> : null}
            {updateState.ok ? <p className="text-xs text-emerald-300">{updateState.ok}</p> : null}
          </form>

          {/* Sección de acciones avanzadas y Reset Password */}
          <div className="grid gap-3 pt-3 border-t border-slate-900 sm:grid-cols-2">
            <div>
              <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Restablecer Contraseña</h5>
              <UserPasswordResetForm id={id} />
            </div>

            <div className="flex flex-col justify-end space-y-2 bg-rose-950/10 rounded border border-rose-900/20 p-3">
              <h5 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Zona de Peligro</h5>
              <p className="text-[11px] text-text-muted">
                La eliminación desactivará las credenciales del usuario definitivamente de forma segura.
              </p>
              
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-center rounded border border-rose-800 bg-accent-red/10 py-1.5 text-xs font-semibold text-accent-red hover:bg-rose-900 hover:text-white transition"
                >
                  Eliminar Usuario
                </button>
              ) : (
                <form action={deleteFormAction} className="flex gap-2">
                  <input type="hidden" name="id" value={id} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="flex-1 rounded bg-rose-600 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {deletePending ? "Eliminando..." : "Confirmar Eliminar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-text-muted hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                </form>
              )}
              {deleteState.error ? <p className="text-xs text-accent-red">{deleteState.error}</p> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
