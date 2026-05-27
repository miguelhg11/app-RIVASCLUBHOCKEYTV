import { StreamKeyCreateForm } from "@/src/components/admin/stream-key-create-form";
import { StreamKeyEditForm } from "@/src/components/admin/stream-key-edit-form";
import { StreamKeyDeleteForm } from "@/src/components/admin/stream-key-delete-form";
import { AutoSyncOnMount } from "@/src/components/ui/auto-sync-on-mount";
import { TeamStreamKeyAssignmentForm } from "@/src/components/admin/team-stream-key-assignment-form";
import { listStreamKeys, listTeams, listTeamStreamKeyAssignmentsMap } from "@/src/lib/admin/queries";

function maskStreamKey(value: string) {
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}********${value.slice(-4)}`;
}

export default async function AdminStreamKeysPage() {
  const [keys, teams, assignments] = await Promise.all([
    listStreamKeys(),
    listTeams(),
    listTeamStreamKeyAssignmentsMap(),
  ]);

  return (
    <div className="space-y-6">
      <AutoSyncOnMount />
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white">
          STREAM KEYS
        </h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
          Gestión de claves de transmisión vinculadas a YouTube
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-xl p-5">
          <StreamKeyCreateForm />
        </div>
        <div className="glass-panel rounded-xl p-5">
          <TeamStreamKeyAssignmentForm
            teams={teams.map((team) => ({ id: team.id, label: team.name }))}
            streamKeys={keys.map((keyRow) => ({ id: keyRow.id, label: keyRow.name }))}
          />
        </div>
      </div>


      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">
          Claves registradas · {keys.length}
        </h2>
        <ul className="space-y-3">
          {keys.map((keyRow) => (
            <li key={keyRow.id} className="glass-card rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-red/10 text-accent-red ring-1 ring-inset ring-accent-red/20">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{keyRow.name}</p>
                    <p className="text-[10px] tracking-wide text-text-muted">
                      {keyRow.youtube_live_stream_id} · {maskStreamKey(keyRow.stream_key)}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${keyRow.active ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20" : "bg-slate-500/10 text-text-muted ring-1 ring-inset ring-slate-500/20"}`}>
                  {keyRow.active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="mt-3">
                <StreamKeyEditForm
                  id={keyRow.id}
                  name={keyRow.name}
                  youtubeLiveStreamId={keyRow.youtube_live_stream_id}
                  streamKey={keyRow.stream_key}
                  rtmpUrl={keyRow.rtmp_url}
                />
                <StreamKeyDeleteForm id={keyRow.id} />
                <p className="mt-2 text-[10px] tracking-wide text-text-muted/70">
                  Equipos asignados: <span className="text-text-muted">{assignments[keyRow.id]?.join(", ") || "—"}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
