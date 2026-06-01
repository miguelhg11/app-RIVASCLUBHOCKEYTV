"use client";

import { useState } from "react";

export function CopyPublicLinkButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof window === "undefined") return;
    
    // Construct absolute URL for the public API
    const publicUrl = `${window.location.origin}/api/reports/weekly/public`;
    
    navigator.clipboard.writeText(publicUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch((err) => {
        console.error("Error al copiar el enlace:", err);
      });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded border border-accent-cyan px-4 py-2 font-medium text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
    >
      {copied ? "¡Copiado!" : "Copiar Enlace Público"}
    </button>
  );
}
