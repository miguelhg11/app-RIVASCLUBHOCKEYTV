import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth/session";
import { getRivasOfficialMatches } from "@/src/lib/federations/unified/get-rivas-official-matches";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const isAdmin = session.role === "admin" || (session.role as string) === "superadmin";
  const matches = await getRivasOfficialMatches(session.email ?? "", isAdmin, { forceRefresh: true });
  
  return NextResponse.json(
    { matches },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
