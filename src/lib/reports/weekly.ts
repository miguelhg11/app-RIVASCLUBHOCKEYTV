import "server-only";

import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export type WeeklyReportRow = {
  rivasTeamLabel: string;
  title: string;
  scheduledStart: string;
  dateLabel: string;
  timeLabel: string;
  watchUrl: string;
  source: "app" | "youtube_external";
};

export async function getWeeklyBroadcastRows(params: { fromIso: string; toIso: string }): Promise<WeeklyReportRow[]> {
  const supabase = getSupabaseServerClient();

  const [appRes, externalRes] = await Promise.all([
    supabase
      .from("broadcasts")
      .select("title,scheduled_start,youtube_watch_url,youtube_share_url,teams(name,letter,categories(name))")
      .is("deleted_at", null)
      .gte("scheduled_start", params.fromIso)
      .lte("scheduled_start", params.toIso)
      .order("scheduled_start", { ascending: true }),
    supabase
      .from("youtube_external_broadcasts")
      .select("title,scheduled_start,youtube_watch_url,youtube_share_url,matched_broadcast_id")
      .not("scheduled_start", "is", null)
      .gte("scheduled_start", params.fromIso)
      .lte("scheduled_start", params.toIso)
      .order("scheduled_start", { ascending: true }),
  ]);

  const appRows = ((appRes.data ?? []) as Array<{
    title: string;
    scheduled_start: string;
    youtube_watch_url: string | null;
    youtube_share_url: string | null;
    teams:
      | {
          name?: string;
          letter?: "A" | "B" | "C" | "D" | null;
          categories?: { name?: string } | { name?: string }[] | null;
        }
      | {
          name?: string;
          letter?: "A" | "B" | "C" | "D" | null;
          categories?: { name?: string } | { name?: string }[] | null;
        }[]
      | null;
  }>).map((row) => mapRow({
    ...row,
    rivasTeamLabel: buildRivasTeamLabel(row.teams),
  }, "app"));

  const externalRows = ((externalRes.data ?? []) as Array<{
    title: string;
    scheduled_start: string;
    youtube_watch_url: string | null;
    youtube_share_url: string | null;
  }>).map((row) => mapRow({
    ...row,
    rivasTeamLabel: "Externa (sin equipo app)",
  }, "youtube_external"));

  return [...appRows, ...externalRows].sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}

function mapRow(
  row: {
    title: string;
    scheduled_start: string;
    youtube_watch_url: string | null;
    youtube_share_url: string | null;
    rivasTeamLabel: string;
  },
  source: "app" | "youtube_external",
): WeeklyReportRow {
  const dt = new Date(row.scheduled_start);
  const dateLabel = Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("es-ES");
  const timeLabel = Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return {
    rivasTeamLabel: row.rivasTeamLabel,
    title: row.title,
    scheduledStart: row.scheduled_start,
    dateLabel,
    timeLabel,
    watchUrl: row.youtube_share_url || row.youtube_watch_url || "",
    source,
  };
}

function buildRivasTeamLabel(
  value:
    | {
        name?: string;
        letter?: "A" | "B" | "C" | "D" | null;
        categories?: { name?: string } | { name?: string }[] | null;
      }
    | {
        name?: string;
        letter?: "A" | "B" | "C" | "D" | null;
        categories?: { name?: string } | { name?: string }[] | null;
      }[]
    | null,
) {
  const team = Array.isArray(value) ? value[0] : value;
  if (!team) return "-";

  const categories = Array.isArray(team.categories)
    ? team.categories
    : team.categories
      ? [team.categories]
      : [];
  const categoryName = categories[0]?.name?.trim() || "";
  const letter = team.letter ?? null;

  if (categoryName && letter) return `${categoryName} ${letter}`;
  if (categoryName) return categoryName;
  if (team.name) return team.name;
  return "-";
}
