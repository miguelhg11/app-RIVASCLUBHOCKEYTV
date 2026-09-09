import { NextResponse } from "next/server";
import { generateWeeklySchedule } from "@/src/lib/schedule/weekly-generator";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await generateWeeklySchedule());
  } catch (error) {
    console.error("Weekly schedule cron failed:", error);
    return NextResponse.json({ error: "No se pudo generar la agenda semanal" }, { status: 500 });
  }
}
