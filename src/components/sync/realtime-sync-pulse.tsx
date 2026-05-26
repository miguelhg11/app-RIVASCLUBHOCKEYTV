"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export function RealtimeSyncPulse() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const disablePulse = process.env.NEXT_PUBLIC_DISABLE_REALTIME_PULSE === "true";
    if (disablePulse) return;

    const fastPaths = new Set([
      "/dashboard/broadcasts", 
      "/dashboard/live", 
      "/admin/broadcasts", 
      "/admin/broadcasts/live",
      "/admin/event-links"
    ]);
    const isFastPath = fastPaths.has(pathname);
    const intervalMs = isFastPath ? 20000 : 60000;

    let lastPulse = 0;
    let refreshInFlight = false;

    const trySyncPulse = async () => {
      const now = Date.now();
      if (!isFastPath) return;
      if (now - lastPulse < 45000) return;
      lastPulse = now;
      try {
        await fetch("/api/sync/pulse", { method: "POST", cache: "no-store", keepalive: true });
      } catch {
        // no-op
      }
    };

    const tick = async () => {
      if (refreshInFlight) return;
      refreshInFlight = true;
      try {
        router.refresh();
      } finally {
        window.setTimeout(() => {
          refreshInFlight = false;
        }, 1500);
      }
    };

    void trySyncPulse();

    const interval = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void trySyncPulse();
        void tick();
      }
    };
    const onFocus = () => {
      void trySyncPulse();
      void tick();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, pathname]);

  return null;
}
