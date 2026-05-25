import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getExternalBroadcastById } from "@/src/lib/broadcast/queries";
import { listTeams, listStreamKeys, listPlaylists } from "@/src/lib/admin/queries";
import { AssignBroadcastForm } from "@/src/components/admin/assign-broadcast-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAssignBroadcastPage({ params }: PageProps) {
  const { id } = await params;

  // UUID simple validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const [externalBroadcast, teams, streamKeys, playlists] = await Promise.all([
    getExternalBroadcastById(id),
    listTeams(),
    listStreamKeys(),
    listPlaylists(),
  ]);

  if (!externalBroadcast) {
    redirect("/admin/broadcasts");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">
          VINCULAR EMISIÓN EXTERNA
        </h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
          Asigna este directo de YouTube Studio a un equipo de la aplicación
        </p>
      </div>

      <AssignBroadcastForm
        externalBroadcast={externalBroadcast}
        teams={teams}
        streamKeys={streamKeys}
        playlists={playlists}
      />

      <div className="mt-6 text-sm">
        <Link href="/admin/broadcasts" className="text-accent-cyan hover:underline transition-all">
          ← Volver a Programaciones
        </Link>
      </div>
    </div>
  );
}
