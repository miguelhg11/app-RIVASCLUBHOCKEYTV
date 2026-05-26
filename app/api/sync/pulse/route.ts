import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth/session";
import { syncChannelBroadcastsAction } from "@/src/actions/broadcast.actions";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await syncChannelBroadcastsAction({});
    return NextResponse.json({ ok: !result.error, message: result.ok ?? result.error ?? "sync" });
  } catch {
    return NextResponse.json({ ok: false, error: "Sync fallida" }, { status: 500 });
  }
}
