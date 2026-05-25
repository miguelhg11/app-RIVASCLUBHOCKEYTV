import "server-only";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { deleteYouTubeBroadcast } from "@/src/lib/youtube/service";
import { sanitizeForLog } from "@/src/lib/logging/sanitize";

export async function expirePendingBroadcasts(): Promise<{ expiredCount: number; error?: string }> {
  const supabase = getSupabaseServerClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find broadcasts that are scheduled for >24 hours ago, and not completed
  const { data: expired, error } = await supabase
    .from("broadcasts")
    .select("id, title, youtube_broadcast_id, scheduled_start, youtube_life_cycle_status")
    .is("deleted_at", null)
    .neq("youtube_life_cycle_status", "complete")
    .lt("scheduled_start", twentyFourHoursAgo);

  if (error) {
    console.error("Failed to query expired broadcasts:", error.message);
    return { expiredCount: 0, error: error.message };
  }

  if (!expired || expired.length === 0) {
    return { expiredCount: 0 };
  }

  let expiredCount = 0;
  for (const bc of expired) {
    // 1. Try deleting from YouTube
    if (bc.youtube_broadcast_id) {
      try {
        await deleteYouTubeBroadcast({ youtubeBroadcastId: bc.youtube_broadcast_id });
      } catch (err) {
        console.error(`Failed to delete broadcast ${bc.youtube_broadcast_id} from YouTube during auto-expiration:`, err);
      }
    }

    // 2. Soft delete in Supabase
    const { error: updateError } = await supabase
      .from("broadcasts")
      .update({
        deleted_at: new Date().toISOString(),
        youtube_last_error: "Expirado y eliminado automáticamente a las 24 horas de la fecha programada sin emisión.",
      })
      .eq("id", bc.id);

    if (updateError) {
      console.error(`Failed to soft delete expired broadcast ${bc.id} locally:`, updateError.message);
    } else {
      expiredCount++;
      // Write operation log (without session context as it runs under cron/system)
      await supabase.from("operation_logs").insert({
        operation_type: "expire_broadcast",
        status: "ok",
        message: `Programación de directo expirada y eliminada automáticamente: ${bc.title}`,
        metadata: sanitizeForLog({
          id: bc.id,
          youtubeBroadcastId: bc.youtube_broadcast_id,
          scheduledStart: bc.scheduled_start,
          lifeCycleStatus: bc.youtube_life_cycle_status,
        }),
      });
    }
  }

  return { expiredCount };
}
