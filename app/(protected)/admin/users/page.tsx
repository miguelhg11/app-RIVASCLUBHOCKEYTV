import { UserCreateForm } from "@/src/components/admin/user-create-form";
import { UserEditForm } from "@/src/components/admin/user-edit-form";
import { ActiveToggleForm } from "@/src/components/admin/active-toggle-form";
import { listTeams, listUserAssignmentsMap, listUsers } from "@/src/lib/admin/queries";

export default async function AdminUsersPage() {
  const [users, teams, assignments] = await Promise.all([
    listUsers(),
    listTeams(),
    listUserAssignmentsMap(),
  ]);

  const teamsOptions = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">Administración de Usuarios</h1>
        <p className="text-sm text-text-muted">
          Crea nuevas cuentas de acceso y gestiona sus permisos/equipos asignados para la temporada seleccionada.
        </p>
      </div>

      {/* Tarjeta 1: CREACIÓN DE USUARIO */}
      <div>
        <UserCreateForm teams={teamsOptions} />
      </div>

      {/* Tarjeta 2: ADMINISTRACIÓN DE USUARIOS */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/8 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-cyan/10 text-xs text-accent-cyan font-bold">2</span>
            Administración de Usuarios
          </h2>
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-text-muted border border-white/10">
            {users.length} {users.length === 1 ? "Usuario" : "Usuarios"}
          </span>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-text-muted/70 italic py-6 text-center">No hay usuarios registrados.</p>
        ) : (
          <ul className="divide-y divide-white/5 space-y-3 pt-1">
            {users.map((user) => {
              const userAss = assignments[user.id] || { teamNames: [], teamIds: [] };
              return (
                <li key={user.id} className="pt-3 first:pt-0">
                  <div className="rounded-xl border border-white/8/80 bg-black/30/60 p-4 transition-all hover:border-white/8 hover:bg-black/30">
                    {/* Fila principal */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">{user.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            user.role === "admin"
                              ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                              : "bg-white/5 text-text-muted border border-white/10/50"
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{user.email}</p>
                        {user.phone && <p className="text-[11px] text-text-muted/70 mt-0.5">📞 {user.phone}</p>}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ActiveToggleForm target="user" id={user.id} active={user.active} />
                      </div>
                    </div>

                    {/* Resumen de recursos asignados */}
                    <div className="mt-3 text-[11px] border-t border-slate-900/60 pt-2 text-text-muted">
                      <div>
                        <span className="font-bold text-text-muted/70">Equipos Asignados: </span>
                        {userAss.teamNames.length > 0 ? (
                          <span className="text-text-muted">{userAss.teamNames.join(", ")}</span>
                        ) : (
                          <span className="text-text-muted/50 italic">Ninguno</span>
                        )}
                      </div>
                    </div>

                    {/* Formulario collapsible de edición in-line */}
                    <UserEditForm
                      id={user.id}
                      name={user.name}
                      email={user.email}
                      phone={user.phone}
                      role={user.role}
                      allTeams={teamsOptions}
                      assignedTeamIds={userAss.teamIds || []}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
