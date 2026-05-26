import { notFound } from "next/navigation";
import { requireSession } from "@/src/lib/auth/guards";
import { getBroadcastForEdit } from "@/src/lib/broadcast/queries";
import {
  getBroadcastFormResourcesForCurrentUser,
  getTeamResourcesMap,
  getActiveThumbnailBackgrounds,
} from "@/src/lib/user/queries";
import { getCategorizedBadges } from "@/src/lib/thumbnails/resolver";
import { EditBroadcastForm } from "@/src/components/forms/edit-broadcast-form";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBroadcastPage({ params }: EditPageProps) {
  const session = await requireSession();

  const { id } = await params;
  
  const [broadcast, assigned, teamResourcesMap, categorizedBadges, activeBackgrounds] = await Promise.all([
    getBroadcastForEdit(id),
    getBroadcastFormResourcesForCurrentUser(),
    getTeamResourcesMap(),
    getCategorizedBadges(),
    getActiveThumbnailBackgrounds(),
  ]);

  if (!broadcast) {
    notFound();
  }

  const isAdmin = session.role === "admin" || (session.role as string) === "superadmin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide text-white font-rajdhani">
          {isAdmin ? "ADMINISTRAR PROGRAMACIONES" : "EDITAR PROGRAMACIÓN PENDIENTE"}
        </h1>
        <p className="mt-1 text-xs tracking-widest text-text-muted uppercase">
          {isAdmin ? "Edición completa de directo" : "Modificar detalles de tu programación"}
        </p>
      </div>

      <EditBroadcastForm
        broadcast={broadcast}
        teams={assigned.teams}
        streamKeys={assigned.streamKeys}
        blockedStreamKeys={assigned.streamKeysBlocked}
        playlists={assigned.playlists}
        teamResourcesMap={teamResourcesMap}
        categorizedBadges={categorizedBadges}
        thumbnailBackgrounds={activeBackgrounds}
        isAdmin={isAdmin}
      />
    </div>
  );
}
