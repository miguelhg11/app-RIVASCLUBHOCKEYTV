import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paramsId } = await params;
  if (!paramsId) {
    return new Response("ID de vídeo no especificado", { status: 400 });
  }

  let videoId = paramsId;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const supabase = getSupabaseServerClient();

  if (uuidRegex.test(videoId)) {
    try {
      // 1. Query broadcasts table
      const { data: bc } = await supabase
        .from("broadcasts")
        .select("youtube_broadcast_id")
        .eq("id", videoId)
        .maybeSingle();

      if (bc?.youtube_broadcast_id) {
        videoId = bc.youtube_broadcast_id;
      } else {
        // 2. Query youtube_external_broadcasts table
        const { data: extBc } = await supabase
          .from("youtube_external_broadcasts")
          .select("youtube_watch_url, youtube_share_url")
          .eq("id", videoId)
          .maybeSingle();

        const urlToExtract = extBc?.youtube_share_url || extBc?.youtube_watch_url || "";
        if (urlToExtract) {
          try {
            const url = new URL(urlToExtract);
            if (url.searchParams.has("v")) {
              videoId = url.searchParams.get("v")!;
            } else {
              videoId = url.pathname.split("/").pop() || videoId;
            }
          } catch {
            videoId = urlToExtract.split("v=").pop()?.split("&")[0] || videoId;
          }
        }
      }
    } catch (resolveError) {
      console.error("Error resolving UUID to YouTube Video ID:", resolveError);
    }
  }

  const reqHeaders = await headers();

  // 1. Extract Vercel Geolocation headers
  let city = reqHeaders.get("x-vercel-ip-city") || "";
  let region = reqHeaders.get("x-vercel-ip-country-region") || "";
  let country = reqHeaders.get("x-vercel-ip-country") || "";

  // Decode city name if it contains URI encoding (common in Spanish accents)
  if (city) {
    try {
      city = decodeURIComponent(city);
    } catch {
      // Keep raw if decode fails
    }
  }

  // 2. Local development fallback (no Vercel headers in localhost)
  if (process.env.NODE_ENV === "development" && !city) {
    const mockLocations = [
      { city: "Rivas-Vaciamadrid", region: "MD", country: "ES" },
      { city: "Rivas-Vaciamadrid", region: "MD", country: "ES" },
      { city: "Rivas-Vaciamadrid", region: "MD", country: "ES" }, // Weight more towards Rivas
      { city: "Arganda del Rey", region: "MD", country: "ES" },
      { city: "Barcelona", region: "CT", country: "ES" },
      { city: "A Coruña", region: "GA", country: "ES" }
    ];
    const chosen = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    city = chosen.city;
    region = chosen.region;
    country = chosen.country;
  }

  // If still empty (e.g. production outside Vercel or proxy, fallback to Unknown)
  city = city || "Desconocido";
  region = region || "Desconocido";
  country = country || "Desconocido";

  // 3. Detect Device Type from User-Agent
  const userAgent = (reqHeaders.get("user-agent") || "").toLowerCase();
  let deviceType = "ORDENADOR"; // Default

  if (
    userAgent.includes("smarttv") ||
    userAgent.includes("googletv") ||
    userAgent.includes("appletv") ||
    userAgent.includes("hbbtv") ||
    userAgent.includes("smart-tv") ||
    userAgent.includes("chromecast")
  ) {
    deviceType = "TELEVISIÓN (Smart TV)";
  } else if (userAgent.includes("ipad") || userAgent.includes("tablet") || userAgent.includes("playbook")) {
    deviceType = "TABLET";
  } else if (
    userAgent.includes("mobile") ||
    userAgent.includes("iphone") ||
    userAgent.includes("android") ||
    userAgent.includes("phone")
  ) {
    deviceType = "MÓVIL";
  }

  // 4. Save to Supabase (non-blocking for the redirect)
  try {
    await supabase.from("broadcast_analytics").insert({
      broadcast_id: videoId,
      city,
      region,
      country,
      device_type: deviceType,
    });
  } catch (dbError) {
    console.error("Error saving tracking log to Supabase:", dbError);
  }

  // 5. Redirect to YouTube Live
  const targetUrl = `https://youtube.com/live/${videoId}?feature=share`;
  return NextResponse.redirect(targetUrl, 302);
}
