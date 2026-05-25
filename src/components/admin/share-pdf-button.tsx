"use client";

import { useState } from "react";

export function SharePdfButton({ pdfHref }: { pdfHref: string }) {
  const [message, setMessage] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function onShare() {
    setMessage("");
    if (typeof navigator === "undefined" || !("share" in navigator)) {
      setMessage("Tu navegador no soporta compartir directo. Usa Descargar PDF.");
      return;
    }

    try {
      setPending(true);
      await (navigator as Navigator).share({
        title: "Programaciones semanales Rivas TV",
        text: "Informe semanal de programaciones",
        url: pdfHref,
      });
      setMessage("Compartido.");
    } catch {
      setMessage("No se pudo compartir ahora.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        disabled={pending}
        className="rounded border border-emerald-500 px-4 py-2 font-medium text-emerald-300 disabled:opacity-50"
      >
        {pending ? "Compartiendo..." : "Compartir PDF"}
      </button>
      {message ? <span className="text-xs text-text-muted">{message}</span> : null}
    </div>
  );
}
