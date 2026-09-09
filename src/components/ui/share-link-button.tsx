"use client";

import { useState } from "react";
import { getYouTubeUrl } from "@/src/lib/youtube/url";

type ShareLinkButtonProps = {
  href: string;
  title: string;
  text?: string;
  className?: string;
};

export function ShareLinkButton({ href, title, text = "Te comparto este directo", className = "" }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const youtubeUrl = getYouTubeUrl(href);

  async function onShare() {
    try {
      const nav: any = typeof window !== "undefined" ? window.navigator : null;
      if (nav && typeof nav.share === "function") {
        await nav.share({ title, text, url: youtubeUrl });
        return;
      }

      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(youtubeUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }
    } catch {
      // no-op
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={`inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-text-muted hover:bg-white/10 hover:text-white transition-all ${className}`}
      title="Compartir enlace"
    >
      <span aria-hidden>📤</span>
      <span>{copied ? "Copiado" : "Compartir"}</span>
    </button>
  );
}
