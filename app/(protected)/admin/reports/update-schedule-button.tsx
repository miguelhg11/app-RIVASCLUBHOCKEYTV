"use client";

import { useState } from "react";
import { triggerManualScheduleGenerationAction } from "@/src/actions/broadcast.actions";

export function UpdateScheduleButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ error?: string; ok?: string } | null>(null);

  const handleUpdate = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await triggerManualScheduleGenerationAction();
      setStatus(result);
    } catch (err) {
      setStatus({ error: "Fallo al enviar la petición de actualización." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
            loading
              ? "bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan cursor-not-allowed animate-pulse"
              : "bg-accent-cyan/10 border-accent-cyan text-accent-cyan hover:bg-accent-cyan/20"
          }`}
        >
          {loading ? "Actualizando..." : "Actualizar Calendario Semanal"}
        </button>
        <span className="text-2xs text-text-muted">
          Última actualización programada automática: Todos los Viernes a las 14:00.
        </span>
      </div>

      {status?.ok && (
        <div className="p-3 text-xs bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-lg">
          {status.ok}
        </div>
      )}

      {status?.error && (
        <div className="p-3 text-xs bg-red-950/20 border border-red-500/30 text-red-400 rounded-lg">
          {status.error}
        </div>
      )}
    </div>
  );
}
