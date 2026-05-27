"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * AutoSyncOnMount
 *
 * Invisible component that triggers a YouTube channel sync automatically
 * when any page mounts it. The server-side action has a 45-second throttle,
 * so multiple pages opened in quick succession do not abuse the YouTube API quota.
 *
 * If the sync succeeds, router.refresh() is called so the page re-renders
 * with the freshest data from Supabase.
 *
 * If the sync fails (network error, API quota, etc.) the page silently keeps
 * showing cached data — no error is surfaced to the user.
 */
export function AutoSyncOnMount() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function runSync() {
      try {
        const res = await fetch("/api/youtube/auto-sync", { method: "GET" });
        if (!res.ok) return;
        const data = (await res.json()) as { synced?: boolean; skipped?: boolean; error?: string };

        // Only refresh the page if we actually fetched fresh data from YouTube
        if (data.synced && !cancelled) {
          router.refresh();
        }
      } catch {
        // Silently ignore network errors — cached data is still shown
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    runSync();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!syncing) return null;

  // Subtle, non-intrusive indicator while sync is in progress
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-white/10 bg-surface-glass/90 px-3 py-2 text-xs text-text-muted shadow-xl backdrop-blur-md transition-opacity"
    >
      <svg
        className="h-3.5 w-3.5 animate-spin text-accent-cyan"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span>Actualizando desde YouTube…</span>
    </div>
  );
}
