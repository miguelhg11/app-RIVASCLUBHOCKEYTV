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
    if (!isFastPath) return;

    const intervalMs = 45000;
    let refreshInFlight = false;

    const tick = async () => {
      if (refreshInFlight || document.visibilityState !== "visible") return;
      refreshInFlight = true;
      try {
        const response = await fetch("/api/sync/pulse", { method: "POST", cache: "no-store" });
        if (response.ok) router.refresh();
      } finally {
        window.setTimeout(() => {
          refreshInFlight = false;
        }, 1500);
      }
    };

    const interval = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };
    const onFocus = () => {
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
