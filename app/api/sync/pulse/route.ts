import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth/session";
import { autoSyncBroadcastStatuses } from "@/src/lib/broadcast/queries";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    await autoSyncBroadcastStatuses();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Sync fallida" }, { status: 500 });
  }
}
