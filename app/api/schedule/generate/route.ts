import { NextResponse } from "next/server";
import { generateWeeklySchedule } from "@/src/lib/schedule/weekly-generator";
import { getSession } from "@/src/lib/auth/session";

/**
 * Generates the weekly static schedule from current Friday to next Thursday.
 * Returns the generated data.
 */
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await generateWeeklySchedule();
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Error in schedule generation route:", err);
    return NextResponse.json({ error: "No se pudo generar la agenda semanal" }, { status: 500 });
  }
}
