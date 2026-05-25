import { NextResponse } from "next/server";
import { getRivasOfficialMatches } from "@/src/lib/federations/unified/get-rivas-official-matches";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.CRON_SECRET ?? "";

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await getRivasOfficialMatches("", true, { forceRefresh: true });
  return NextResponse.json({ ok: true, refreshed: matches.length, windowDays: 7 });
}
