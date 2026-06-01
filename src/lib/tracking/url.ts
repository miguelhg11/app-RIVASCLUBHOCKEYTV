/**
 * Extracts the YouTube video ID from any YouTube URL format:
 *   - https://youtube.com/live/UPAXugEVrX4?feature=share
 *   - https://youtu.be/UPAXugEVrX4
 *   - https://www.youtube.com/watch?v=UPAXugEVrX4
 *   - https://www.youtube.com/embed/UPAXugEVrX4
 *
 * Returns the raw string unchanged if it doesn't look like a YouTube URL
 * (i.e. it's already a bare video ID or a tracking URL).
 */
export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return "";

  // Already a bare 11-char YouTube ID (no slashes, no dots)
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;

  try {
    const u = new URL(urlOrId);

    // youtu.be/<id>
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] || urlOrId;
    }

    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v");
    if (v) return v;

    // youtube.com/live/<id>  or  youtube.com/embed/<id>  or  youtube.com/shorts/<id>
    const pathParts = u.pathname.split("/").filter(Boolean);
    const liveIdx = pathParts.findIndex((p) =>
      ["live", "embed", "shorts", "v"].includes(p)
    );
    if (liveIdx !== -1 && pathParts[liveIdx + 1]) {
      return pathParts[liveIdx + 1];
    }
  } catch {
    // Not a valid URL — return as-is (might already be a bare ID)
  }

  return urlOrId;
}

/**
 * Generates a silent tracking URL that captures viewer geolocation
 * and device data before redirecting transparently to YouTube.
 *
 * The end user experiences a seamless redirect with zero visual feedback —
 * they land directly on YouTube as if clicking a normal YouTube link.
 * Meanwhile, our server captures city, region, country, and device type
 * for the analytics dashboard.
 *
 * MANDATORY: Use this everywhere a YouTube link is shared or opened publicly:
 * - Watch buttons
 * - Share buttons
 * - PDF exports
 * - Email schedules
 *
 * @param youtubeUrlOrId - Any YouTube URL or bare 11-char video ID
 * @param baseUrl - App base URL. Falls back to APP_BASE_URL env or production URL.
 */
export function getTrackingUrl(youtubeUrlOrId: string, baseUrl?: string): string {
  if (!youtubeUrlOrId) return "";
  const videoId = extractYouTubeId(youtubeUrlOrId);
  const base = (baseUrl ?? process.env.APP_BASE_URL ?? "https://rivasyoutubelivehandoff.vercel.app").replace(/\/$/, "");
  return `${base}/r/${videoId}`;
}
