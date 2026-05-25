import { countUnassignedExternalBroadcasts } from "@/src/lib/broadcast/queries";
import { AdminPageClient } from "@/src/components/admin/admin-page-client";

export default async function AdminPage() {
  const unassignedCount = await countUnassignedExternalBroadcasts();
  return <AdminPageClient unassignedCount={unassignedCount} />;
}
