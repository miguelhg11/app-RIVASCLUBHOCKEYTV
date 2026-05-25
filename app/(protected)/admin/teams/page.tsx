import { TeamCreateForm } from "@/src/components/admin/team-create-form";
import { TeamEditForm } from "@/src/components/admin/team-edit-form";
import { TeamDeleteForm } from "@/src/components/admin/team-delete-form";
import { listCategories, listTeams, listStreamKeys, listPlaylists, listTeamStreamKeyAssignmentsMap } from "@/src/lib/admin/queries";
import { getSupabaseSchemaStatus } from "@/src/lib/supabase/schema-diagnostics";

export default async function AdminTeamsPage() {
  const [categories, teams, schema, keys, playlists, assignments] = await Promise.all([
    listCategories(),
    listTeams(),
    getSupabaseSchemaStatus(),
    listStreamKeys(),
    listPlaylists(),
    listTeamStreamKeyAssignmentsMap(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold tracking-wide text-white">Admin · Equipos</h1>
      {!schema.teamsLetter || !schema.teamsActive || !schema.teamPlaylistsTable ? (
        <section className="mt-3 rounded border border-amber-600/50 bg-amber-500/10 p-3 text-xs text-amber-100 space-y-1">
          {!schema.teamsLetter || !schema.teamsActive ? (
            <p>⚠ Esquema parcial en <code>teams</code> (faltan columnas <code>letter</code> y/o <code>active</code>).</p>
          ) : null}
          {!schema.teamPlaylistsTable ? (
            <p>⚠ Falta la tabla <code>team_playlists</code>. Ejecuta la migración SQL <code>006_team_playlists.sql</code> en el SQL Editor de Supabase para poder guardar playlists por equipo.</p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-4">
        <TeamCreateForm
          categories={categories}
          streamKeys={keys
            .filter((k) => !(assignments[k.id]?.length > 0))
            .map((x) => ({ id: x.id, name: x.name }))}
          playlists={playlists.map((x) => ({ id: x.id, name: x.name }))}
        />
      </div>

      <section className="mt-4 glass-panel rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Equipos ({teams.length})</h2>
        <ul className="mt-2 space-y-2">
          {teams.map((team) => {
            const assignedKeys = team.team_stream_keys || [];
            const assignedPlaylists = team.team_playlists || [];

            return (
              <li key={team.id} className="glass-input rounded-lg px-3 py-3 text-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-base text-white">{team.name}</strong> · 
                    <span className="text-text-muted">{team.categories?.[0]?.name ?? "Sin categoria"}</span>
                    {team.letter ? (
                      <span className="rounded-full bg-cyan-950 text-accent-cyan px-2 py-0.5 text-xs font-semibold">
                        Letra {team.letter}
                      </span>
                    ) : null}
                    <span className={`text-xs px-2 py-0.5 rounded ${team.active ? "text-emerald-400 bg-emerald-950/20" : "text-text-muted bg-white/[0.03]"}`}>
                      {team.active ? "activo" : "inactivo"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 font-medium text-text-muted border border-white/10">
                      🔑 Claves: {assignedKeys.length}
                    </span>
                    <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 font-medium text-text-muted border border-white/10">
                      📺 Playlists: {assignedPlaylists.length}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-900 pt-3">
                  <TeamEditForm
                    id={team.id}
                    categoryId={team.category_id}
                    name={team.name}
                    displayName={team.display_name}
                    letter={team.letter}
                    categories={categories.map((x) => ({ id: x.id, name: x.name }))}
                    streamKeys={keys
                      .filter((k) => !(assignments[k.id]?.length > 0) || assignedKeys.some((ak) => ak.stream_key_id === k.id))
                      .map((x) => ({ id: x.id, name: x.name }))}
                    playlists={playlists.map((x) => ({ id: x.id, name: x.name }))}
                    assignedStreamKeyIds={assignedKeys.map((x) => x.stream_key_id)}
                    assignedPlaylistIds={assignedPlaylists.map((x) => x.playlist_id)}
                  />
                </div>
                <div className="mt-2 text-right">
                  <TeamDeleteForm id={team.id} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
