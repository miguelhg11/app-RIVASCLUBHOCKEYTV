"use client";

import { useState } from "react";

type Props = {
  videoIdOrUuid: string;
};

export function CopyTrackingLinkButton({ videoIdOrUuid }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof window === "undefined") return;

    const trackingUrl = `${window.location.origin}/r/${videoIdOrUuid}`;

    navigator.clipboard.writeText(trackingUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error copying tracking link:", err);
      });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded bg-accent-cyan/10 border border-accent-cyan/30 px-3 py-1 text-xs font-semibold text-accent-cyan hover:bg-accent-cyan/20 transition-all active:scale-[0.98]"
    >
      {copied ? "¡Copiado!" : "Copiar Enlace para Compartir (con tracking)"}
    </button>
  );
}
