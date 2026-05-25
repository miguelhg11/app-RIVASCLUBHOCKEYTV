"use client";

import { useActionState } from "react";
import { saveFederationSettingsAction, type FederationSettingsState } from "@/src/actions/federations.actions";
import type { FederationSourceConfig } from "@/src/lib/federations/settings";

const initialState: FederationSettingsState = {};

export function FederationsSettingsForm({
  sources,
}: {
  sources: FederationSourceConfig[];
}) {
  const [state, formAction, pending] = useActionState(saveFederationSettingsAction, initialState);
  const fmp = sources.find((x) => x.source === "fmp");
  const rfep = sources.find((x) => x.source === "rfep");

  const statusTone = (status?: string | null) => {
    if (status === "ok") return "text-emerald-300";
    if (status === "error") return "text-accent-red";
    return "text-text-muted";
  };

  const statusText = (status?: string | null) => {
    if (status === "ok") return "OK";
    if (status === "error") return "Error";
    return "Sin probar";
  };

  return (
    <form action={formAction} className="glass-panel rounded-xl p-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-text-muted uppercase">Consola de federaciones</h2>

      <div className="mt-3 rounded border border-white/10 p-3 text-sm">
        <p className="font-semibold">Identidad del club</p>
        <p className="mt-1 text-xs text-text-muted">Token primario recomendado: RIVAS. Alias en CSV (solo preferencia, no obligatorios).</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input name="fmpPrimaryToken" defaultValue={fmp?.clubPrimaryToken ?? "RIVAS"} placeholder="Token FMP" className="w-full rounded border border-white/10 bg-black/30 px-2 py-1" />
          <input name="rfepPrimaryToken" defaultValue={rfep?.clubPrimaryToken ?? "RIVAS"} placeholder="Token RFEP" className="w-full rounded border border-white/10 bg-black/30 px-2 py-1" />
          <input name="fmpAliases" defaultValue={(fmp?.preferredAliases ?? []).join(", ")} placeholder="Alias FMP CSV" className="w-full rounded border border-white/10 bg-black/30 px-2 py-1" />
          <input name="rfepAliases" defaultValue={(rfep?.preferredAliases ?? []).join(", ")} placeholder="Alias RFEP CSV" className="w-full rounded border border-white/10 bg-black/30 px-2 py-1" />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="rounded border border-white/10 p-3 text-sm">
          <span className="font-semibold">FMP</span>
          <input type="checkbox" name="fmpActive" defaultChecked={Boolean(fmp?.active)} className="ml-2" /> Activa
          <input
            name="fmpUrl"
            defaultValue={fmp?.url ?? ""}
            placeholder="URL feed FMP"
            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-2 py-1"
          />
          <input
            name="fmpBaseUrl"
            defaultValue={fmp?.baseUrl ?? "https://sidgad.cloud/shared/portales_files/agenda_portales.php"}
            placeholder="Base URL FMP"
            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-2 py-1"
          />
        </label>

        <label className="rounded border border-white/10 p-3 text-sm">
          <span className="font-semibold">RFEP</span>
          <input type="checkbox" name="rfepActive" defaultChecked={Boolean(rfep?.active)} className="ml-2" /> Activa
          <input
            name="rfepUrl"
            defaultValue={rfep?.url ?? ""}
            placeholder="URL feed RFEP"
            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-2 py-1"
          />
          <input
            name="rfepBaseUrl"
            defaultValue={rfep?.baseUrl ?? "https://www.server2.sidgad.es/rfep"}
            placeholder="Base URL RFEP"
            className="mt-2 w-full rounded border border-white/10 bg-black/30 px-2 py-1"
          />
        </label>
      </div>

      <div className="mt-3 rounded border border-white/10 p-3 text-sm">
        <p className="font-semibold">Diagnostico y cache</p>
        <div className="mt-2 grid gap-1 text-xs">
          <p className={statusTone(fmp?.lastStatus)}>FMP: {statusText(fmp?.lastStatus)}{fmp?.lastError ? ` (${fmp.lastError})` : ""}</p>
          <p className={statusTone(rfep?.lastStatus)}>RFEP: {statusText(rfep?.lastStatus)}{rfep?.lastError ? ` (${rfep.lastError})` : ""}</p>
        </div>
        <input type="hidden" name="defaultRangeDays" value={String(fmp?.defaultRangeDays ?? 7)} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="submit" name="intent" value="save-config" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-xs">
            {pending ? "Guardando..." : "Guardar configuracion"}
          </button>
          <button type="submit" name="intent" value="run-diagnostics" disabled={pending} className="rounded border border-white/10 px-4 py-2 text-sm font-medium text-white">
            Probar todo
          </button>
          <button type="submit" name="intent" value="clear-cache" disabled={pending} className="rounded border border-amber-700 px-4 py-2 text-sm font-medium text-amber-300">
            Limpiar cache
          </button>
        </div>
      </div>

      {state.error ? <p className="mt-2 text-sm text-accent-red">{state.error}</p> : null}
      {state.ok ? <p className="mt-2 text-sm text-emerald-300">{state.ok}</p> : null}
      {state.diagnostics ? <p className="mt-2 text-xs text-text-muted">{state.diagnostics}</p> : null}

      <p className="mt-3 text-xs text-text-muted">
        La app busca automaticamente todas las competiciones de RIVAS en los proximos 7 dias.
        Solo necesitas configurar fuentes y comprobar diagnostico.
      </p>
    </form>
  );
}
