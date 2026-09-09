"use client";

import React, { useState } from "react";
import { getYouTubeUrl } from "@/src/lib/youtube/url";

type YouTubeShareButtonProps = {
  href: string;
  className?: string;
  size?: "sm" | "md";
};

export function YouTubeShareButton({ href, className = "", size = "md" }: YouTubeShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const logoHeight = size === "sm" ? "h-5" : "h-7";

  const youtubeUrl = getYouTubeUrl(href);

  async function onShare() {
    try {
      const nav: any = typeof window !== "undefined" ? window.navigator : null;
      if (nav && typeof nav.share === "function") {
        await nav.share({
          title: "Directo Rivas TV",
          text: "Te comparto este directo de Rivas TV",
          url: youtubeUrl,
        });
        return;
      }

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(youtubeUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }
    } catch {
      // no-op or user cancelled share sheet
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={`inline-flex items-center justify-center transition-all active:scale-[0.9] hover:opacity-85 group cursor-pointer select-none border-0 bg-transparent p-0 ${className}`}
      title={copied ? "¡Enlace copiado!" : "Compartir directo"}
    >
      <svg
        className={`${logoHeight} w-auto`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Curved Share Arrow in YouTube Red, dynamic colors or badges if copied */}
        <path
          d="M14 9V5L22 12L14 19V15C9 15 5.5 16.6 3 20C4 15 7 10 14 9Z"
          fill={copied ? "#22C55E" : "#FF0000"}
          className="group-hover:scale-105 origin-center transition-transform duration-200"
        />
      </svg>
      {copied && (
        <span className="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in-out">
          ¡Copiado!
        </span>
      )}
    </button>
  );
}
