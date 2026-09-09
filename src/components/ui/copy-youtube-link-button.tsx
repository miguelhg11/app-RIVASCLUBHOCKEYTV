"use client";

import { useState } from "react";
import { getYouTubeUrl } from "@/src/lib/youtube/url";

type Props = {
  href: string;
  iconOnly?: boolean;
  className?: string;
};

export function CopyYouTubeLinkButton({ href, iconOnly = false, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(getYouTubeUrl(href))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error copying YouTube link:", err);
      });
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "¡Enlace copiado!" : "Copiar enlace de YouTube"}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all active:scale-[0.9] hover:opacity-85 ${
          copied
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20"
        } ${className}`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={copied ? "M5 13l4 4L19 7" : "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"} />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded bg-accent-cyan/10 border border-accent-cyan/30 px-3 py-1.5 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/20 transition-all active:scale-[0.98] ${
        copied ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""
      } ${className}`}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={copied ? "M5 13l4 4L19 7" : "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"} />
      </svg>
      <span>{copied ? "¡Copiado!" : "Copiar enlace"}</span>
    </button>
  );
}
