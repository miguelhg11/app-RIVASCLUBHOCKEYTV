import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth/session";
import { syncChannelBroadcastsAction } from "@/src/actions/broadcast.actions";

/**
 * GET /api/youtube/auto-sync
 *
 * Triggers a YouTube channel sync (streams, playlists, broadcasts, videos)
 * from the server side. The underlying action already has a 45-second throttle
 * so consecutive requests within that window are fast no-ops.
 *
 * Protected: requires a valid session cookie.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await syncChannelBroadcastsAction({});

    if (result.error) {
      // Return 200 so the client knows the request succeeded, but note the sync error.
      // The UI will continue showing cached data gracefully.
      return NextResponse.json({ error: result.error, synced: false });
    }

    const skipped = result.ok?.startsWith("Sync reciente");
    return NextResponse.json({ ok: result.ok, synced: !skipped, skipped: skipped ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[auto-sync] Unhandled error:", message);
    return NextResponse.json({ error: message, synced: false });
  }
}
