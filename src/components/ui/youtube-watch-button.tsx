/**
 * YouTubeWatchButton
 *
 * Opens the broadcast on YouTube via the tracking redirect (/r/<videoId>).
 * The viewer lands directly on YouTube — the redirect is instantaneous and invisible.
 * Geographic and device data are captured server-side for analytics.
 *
 * NEVER passes a direct youtube.com URL to the end user.
 */
"use client";

import React from "react";
import { extractYouTubeId } from "@/src/lib/tracking/url";

type YouTubeWatchButtonProps = {
  /** Any YouTube URL (watch, live, youtu.be, share) or bare video ID */
  href: string;
  className?: string;
  size?: "sm" | "md";
};

export function YouTubeWatchButton({ href, className = "", size = "md" }: YouTubeWatchButtonProps) {
  const logoHeight = size === "sm" ? "h-5" : "h-7";

  // Convert any YouTube URL to our tracking redirect — silently
  const videoId = extractYouTubeId(href);
  const trackingHref =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${videoId}`
      : `/r/${videoId}`;

  return (
    <a
      href={trackingHref}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center transition-all active:scale-[0.9] hover:opacity-85 group cursor-pointer select-none ${className}`}
      title="Ver en YouTube"
    >
      <svg
        className={`${logoHeight} w-auto`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Red Rounded Rectangle Icon */}
        <path
          d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z"
          fill="#FF0000"
          className="group-hover:scale-105 origin-center transition-transform duration-200"
        />
        {/* White Play Triangle */}
        <polygon points="9.545 15.568 15.818 12 9.545 8.432" fill="white" />
      </svg>
    </a>
  );
}
