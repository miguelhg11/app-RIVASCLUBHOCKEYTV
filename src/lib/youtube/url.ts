/** Extracts a YouTube video ID from common URL formats or returns a bare ID unchanged. */
export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return "";
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId;

  try {
    const url = new URL(urlOrId);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("?")[0] || urlOrId;
    }

    const queryId = url.searchParams.get("v");
    if (queryId) return queryId;

    const pathParts = url.pathname.split("/").filter(Boolean);
    const idIndex = pathParts.findIndex((part) =>
      ["live", "embed", "shorts", "v"].includes(part)
    );
    if (idIndex !== -1 && pathParts[idIndex + 1]) {
      return pathParts[idIndex + 1];
    }
  } catch {
    // A bare ID is handled below.
  }

  return urlOrId;
}

/** Returns a direct YouTube URL without passing through the application. */
export function getYouTubeUrl(urlOrId: string): string {
  if (!urlOrId) return "";

  try {
    const url = new URL(urlOrId);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    // Build a canonical URL from a bare video ID.
  }

  return `https://youtube.com/live/${extractYouTubeId(urlOrId)}?feature=share`;
}
