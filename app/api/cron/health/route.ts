import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { verifyYouTubeConnection } from "@/src/lib/youtube/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeout = <T,>(promise: PromiseLike<T>, label: string) =>
    Promise.race<T>([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), 10_000)),
    ]);

  const [supabaseResult, youtubeResult] = await Promise.allSettled([
    timeout(
      getSupabaseServerClient().from("app_settings").select("key", { count: "exact", head: true }).limit(1).then(({ error }) => {
        if (error) throw error;
        return true;
      }),
      "Supabase",
    ),
    timeout(verifyYouTubeConnection(), "YouTube"),
  ]);

  const checks = {
    supabase: supabaseResult.status === "fulfilled",
    youtube: youtubeResult.status === "fulfilled",
    email: Boolean(process.env.RESEND_API_KEY || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)),
  };
  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { ok, checks, checkedAt: new Date().toISOString() },
    { status: ok ? 200 : 503 },
  );
}
