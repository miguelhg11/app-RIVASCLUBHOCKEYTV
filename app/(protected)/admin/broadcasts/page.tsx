import Link from "next/link";
import { SyncBroadcastsForm } from "@/src/components/admin/sync-broadcasts-form";
import { listPendingBroadcastsAdmin, listUnassignedExternalBroadcasts } from "@/src/lib/broadcast/queries";
import { listUsers, listTeams } from "@/src/lib/admin/queries";
import { PendingBroadcastsList } from "@/src/components/admin/pending-broadcasts-list";
import { ReactiveSyncHandler } from "@/src/components/ui/reactive-sync-handler";

export default async function AdminBroadcastsPage() {
  const [broadcasts, unassignedBroadcasts, users, teams] = await Promise.all([
    listPendingBroadcastsAdmin(),
    listUnassignedExternalBroadcasts(),
    listUsers(),
    listTeams(),
  ]);

  return (
    <div className="space-y-6">
      <ReactiveSyncHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">
            ADMINISTRAR PROGRAMACIONES
          </h1>
          <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
            Gestión y estado de emisiones pendientes de emisión
          </p>
        </div>
        <div>
          <SyncBroadcastsForm />
        </div>
      </div>

      <PendingBroadcastsList
        initialBroadcasts={broadcasts}
        unassignedBroadcasts={unassignedBroadcasts}
        users={users}
        teams={teams}
      />

      <div className="mt-6 text-sm">
        <Link href="/admin" className="text-accent-cyan hover:underline transition-all">
          ← Volver a Admin
        </Link>
      </div>
    </div>
  );
}
