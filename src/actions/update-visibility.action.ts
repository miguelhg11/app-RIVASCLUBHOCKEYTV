"use server";

import { requireAdmin } from "@/src/lib/auth/guards";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { updateYouTubeBroadcast, updateYouTubeVideoPrivacyStatus } from "@/src/lib/youtube/service";
import { revalidateAllResourcePaths } from "@/src/actions/admin.actions";
import { sanitizeForLog } from "@/src/lib/logging/sanitize";

export type UpdateVisibilityState = {
  error?: string;
  ok?: boolean;
};

export async function updateContentVisibilityAction(
  type: "broadcast" | "video",
  id: string,
  privacyStatus: "unlisted" | "public",
): Promise<UpdateVisibilityState> {
  const session = await requireAdmin();
  const supabase = getSupabaseServerClient();

  if (privacyStatus !== "unlisted" && privacyStatus !== "public") {
    return { error: "Estado de privacidad no válido." };
  }

  try {
    if (type === "broadcast") {
      // 1. Fetch existing broadcast details
      const { data: bc, error: fetchError } = await supabase
        .from("broadcasts")
        .select("id, youtube_broadcast_id, title, description, scheduled_start")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !bc) {
        return { error: "No se encontró la transmisión seleccionada." };
      }

      // 2. Update on YouTube
      if (bc.youtube_broadcast_id) {
        await updateYouTubeBroadcast({
          youtubeBroadcastId: bc.youtube_broadcast_id,
          title: bc.title,
          description: bc.description ?? "",
          scheduledStart: bc.scheduled_start,
          privacyStatus,
        });
      }

      // 3. Update in local DB
      const { error: updateError } = await supabase
        .from("broadcasts")
        .update({
          privacy_status: privacyStatus,
          visibility_public_confirmed: privacyStatus === "public",
          visibility_public_confirmed_by: privacyStatus === "public" ? session.userId : null,
          visibility_public_confirmed_at: privacyStatus === "public" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Error en base de datos: ${updateError.message}`);
      }

      await supabase.from("operation_logs").insert({
        user_id: session.userId,
        broadcast_id: id,
        operation_type: "update_visibility",
        status: "ok",
        message: `Visibilidad de transmisión cambiada a: ${privacyStatus}`,
        metadata: sanitizeForLog({ id, type, privacyStatus }),
      });

    } else {
      // type === "video" (cached video or finished event link)
      // 1. Fetch existing video
      const { data: video, error: fetchError } = await supabase
        .from("youtube_channel_videos")
        .select("youtube_video_id")
        .eq("youtube_video_id", id)
        .maybeSingle();

      if (fetchError || !video) {
        return { error: "No se encontró el video seleccionado." };
      }

      // 2. Update on YouTube
      await updateYouTubeVideoPrivacyStatus({
        youtubeVideoId: video.youtube_video_id,
        privacyStatus,
      });

      // 3. Update in local DB
      const { error: updateError } = await supabase
        .from("youtube_channel_videos")
        .update({
          privacy_status: privacyStatus,
        })
        .eq("youtube_video_id", id);

      if (updateError) {
        throw new Error(`Error en base de datos: ${updateError.message}`);
      }

      // Also try to update any linked broadcast privacy status in broadcasts table (if it exists)
      await supabase
        .from("broadcasts")
        .update({
          privacy_status: privacyStatus,
          visibility_public_confirmed: privacyStatus === "public",
          visibility_public_confirmed_by: privacyStatus === "public" ? session.userId : null,
          visibility_public_confirmed_at: privacyStatus === "public" ? new Date().toISOString() : null,
        })
        .eq("youtube_video_id", id);

      await supabase.from("operation_logs").insert({
        user_id: session.userId,
        operation_type: "update_visibility",
        status: "ok",
        message: `Visibilidad de video cambiada a: ${privacyStatus}`,
        metadata: sanitizeForLog({ id, type, privacyStatus }),
      });
    }

    await revalidateAllResourcePaths();
    return { ok: true };

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "update_visibility",
      status: "failed",
      message: `Fallo al cambiar visibilidad: ${msg}`,
      metadata: sanitizeForLog({ id, type, privacyStatus }),
    });
    return { error: `No se pudo cambiar la visibilidad: ${msg}` };
  }
}
