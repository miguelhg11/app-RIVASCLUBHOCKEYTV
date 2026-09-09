import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { sendEmail } from "@/src/lib/email/service";

export type GenerateScheduleResult = {
  success: boolean;
  startDate: string;
  endDate: string;
  matchesCount: number;
  data: any[];
};

export async function generateWeeklySchedule(): Promise<GenerateScheduleResult> {
  const supabase = getSupabaseServerClient();
  
  // 1. Calculate Friday 00:00:00 to next Thursday 23:59:59 based on UTC as reference
  const now = new Date();
  const currentDay = now.getUTCDay(); 
  
  let offsetToFriday = currentDay - 5;
  if (offsetToFriday < 0) {
    offsetToFriday = 7 + offsetToFriday;
  }
  
  const friday = new Date(now);
  friday.setUTCDate(now.getUTCDate() - offsetToFriday);
  friday.setUTCHours(0, 0, 0, 0);

  const thursday = new Date(friday);
  thursday.setUTCDate(friday.getUTCDate() + 6);
  thursday.setUTCHours(23, 59, 59, 999);

  const startDateStr = friday.toISOString().split("T")[0];
  const endDateStr = thursday.toISOString().split("T")[0];

  // 2. Fetch all local broadcasts in that range
  const { data: broadcasts, error: broadcastsError } = await supabase
    .from("broadcasts")
    .select(`
      id,
      youtube_broadcast_id,
      title,
      description,
      scheduled_start,
      youtube_watch_url,
      youtube_share_url,
      youtube_embed_url,
      youtube_life_cycle_status,
      home_team_name,
      away_team_name,
      competition_name,
      venue,
      home_crest_url,
      away_crest_url,
      teams ( name )
    `)
    .gte("scheduled_start", friday.toISOString())
    .lte("scheduled_start", thursday.toISOString())
    .is("deleted_at", null)
    .order("scheduled_start", { ascending: true });

  if (broadcastsError) {
    throw new Error(`Database error fetching broadcasts: ${broadcastsError.message}`);
  }

  // 3. Fetch all external broadcasts in that range
  const { data: externalBroadcasts } = await supabase
    .from("youtube_external_broadcasts")
    .select(`
      id,
      title,
      description,
      scheduled_start,
      youtube_watch_url,
      youtube_share_url,
      youtube_embed_url,
      youtube_life_cycle_status,
      matched_broadcast_id
    `)
    .gte("scheduled_start", friday.toISOString())
    .lte("scheduled_start", thursday.toISOString())
    .order("scheduled_start", { ascending: true });

  const filteredExternals = (externalBroadcasts ?? []).filter(
    (ext) => !ext.matched_broadcast_id
  );

  // Merge both lists into a single schedule payload
  const mergedList = [
    ...broadcasts.map((b: any) => ({
      id: b.id,
      type: "internal",
      title: b.title,
      homeTeam: b.home_team_name,
      awayTeam: b.away_team_name,
      competition: b.competition_name,
      teamName: b.teams?.name || "Rivas",
      venue: b.venue,
      homeLogo: b.home_crest_url,
      awayLogo: b.away_crest_url,
      scheduledStart: b.scheduled_start,
      watchUrl: b.youtube_watch_url,
      shareUrl: b.youtube_share_url,
      embedUrl: b.youtube_embed_url,
      status: b.youtube_life_cycle_status,
    })),
    ...filteredExternals.map((e) => ({
      id: e.id,
      type: "external",
      title: e.title,
      homeTeam: null,
      awayTeam: null,
      competition: "YouTube Externo",
      teamName: "Rivas",
      venue: null,
      homeLogo: null,
      awayLogo: null,
      scheduledStart: e.scheduled_start,
      watchUrl: e.youtube_watch_url,
      shareUrl: e.youtube_share_url,
      embedUrl: e.youtube_embed_url,
      status: e.youtube_life_cycle_status,
    })),
  ].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

  // 4. Save/Upsert into weekly_schedules database
  const { data: existing } = await supabase
    .from("weekly_schedules")
    .select("id")
    .eq("start_date", startDateStr)
    .eq("end_date", endDateStr)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("weekly_schedules")
      .update({
        data: mergedList,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("weekly_schedules")
      .insert({
        start_date: startDateStr,
        end_date: endDateStr,
        data: mergedList,
      });
  }

  // 5. Query all active and non-deleted administrators to send the summary email
  const { data: admins } = await supabase
    .from("users")
    .select("email, name")
    .eq("role", "admin")
    .eq("active", true)
    .is("deleted_at", null);

  if (admins && admins.length > 0) {
    const formattedFriday = friday.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
    const formattedThursday = thursday.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
    
    const adminEmails = admins.map((a) => a.email).filter(Boolean);
    const subject = `[Rivas TV] Planificación de Partidos Semanal (${formattedFriday} - ${formattedThursday})`;
    
    const appUrl = process.env.APP_BASE_URL || "https://rivasyoutubelivehandoff.vercel.app";
    const matchesHtml = mergedList.length === 0 
      ? `<p style="color: #888;">No hay partidos programados para esta semana.</p>`
      : `<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #ff1a1a; color: white; text-align: left;">
              <th style="padding: 10px; font-size: 13px;">Fecha/Hora</th>
              <th style="padding: 10px; font-size: 13px;">Partido</th>
              <th style="padding: 10px; font-size: 13px;">Competición</th>
              <th style="padding: 10px; font-size: 13px;">Enlace</th>
            </tr>
          </thead>
          <tbody>
            ${mergedList.map((m) => {
              const dateStr = new Date(m.scheduledStart).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Madrid"
              });
              return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #f0f0f5;">
                  <td style="padding: 10px; font-size: 13px; font-family: monospace;">${dateStr}</td>
                  <td style="padding: 10px; font-size: 13px; font-weight: bold;">${m.title}</td>
                  <td style="padding: 10px; font-size: 13px; color: #8a8b99;">${m.competition}</td>
                  <td style="padding: 10px; font-size: 13px;">
                    ${m.watchUrl ? `<a href="${m.watchUrl}" style="color: #00e5ff; text-decoration: none;">Ver directo ↗</a>` : "-"}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #222; border-radius: 8px; background-color: #0c0d12; color: #f0f0f5;">
        <h2 style="color: #ff1a1a; font-family: sans-serif; text-transform: uppercase; border-bottom: 2px solid #ff1a1a; padding-bottom: 10px; margin-top: 0;">Planificación Semanal Generada</h2>
        <p style="font-size: 14px; line-height: 1.5;">Hola administrador,</p>
        <p style="font-size: 14px; line-height: 1.5;">Se ha generado / actualizado la planificación estática de directos para el período del <strong>${formattedFriday}</strong> al <strong>${formattedThursday}</strong>.</p>
        
        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 5px;"><strong>Resumen de la jornada (${mergedList.length} partidos):</strong></p>
        ${matchesHtml}

        <div style="background-color: rgba(0, 229, 255, 0.05); border-left: 4px solid #00e5ff; padding: 12px; margin: 25px 0; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; font-size: 13px; color: #00e5ff; font-weight: bold;">📢 ENLACE DE ACCESO PÚBLICO:</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; line-height: 1.4;">
            Puedes compartir esta planificación con vuestra audiencia en redes sociales utilizando el siguiente enlace directo:
            <br/>
            <a href="${appUrl}/api/reports/weekly/public" style="color: #ff1a1a; font-weight: bold; text-decoration: none;">
              ${appUrl}/api/reports/weekly/public ↗
            </a>
          </p>
        </div>

        <p style="font-size: 12px; color: #8a8b99; line-height: 1.5; margin-top: 25px;">* Esta lista se actualiza automáticamente todos los viernes a las 14:00. Si hay cambios de última hora en los partidos o stream keys, puedes forzar una sincronización desde el Panel Admin.</p>
        
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
        <p style="font-size: 11px; color: #8a8b99; text-align: center; margin: 0;">Rivas TV · Club Hockey Rivas</p>
      </div>
    `;

    await Promise.all(
      adminEmails.map((email) => sendEmail(email, subject, htmlContent))
    );
  }

  return {
    success: true,
    startDate: startDateStr,
    endDate: endDateStr,
    matchesCount: mergedList.length,
    data: mergedList
  };
}
