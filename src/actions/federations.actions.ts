"use server";

import { requireAdmin } from "@/src/lib/auth/guards";
import { sanitizeForLog } from "@/src/lib/logging/sanitize";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import {
  saveFederationSourcesConfig,
  type FederationSourceConfig,
} from "@/src/lib/federations/settings";
import { fetchFmpRivasNext7DaysMatches } from "@/src/lib/federations/fmp/adapter";
import { fetchRivasRfepMatchesNext7Days } from "@/src/lib/federations/rfep/adapter";
import { getRivasOfficialMatches } from "@/src/lib/federations/unified/get-rivas-official-matches";

export type FederationSettingsState = {
  error?: string;
  ok?: string;
  diagnostics?: string;
};

export async function saveFederationSettingsAction(
  _prev: FederationSettingsState,
  formData: FormData,
): Promise<FederationSettingsState> {
  const session = await requireAdmin();
  const intent = String(formData.get("intent") ?? "save-config");
  const supabase = getSupabaseServerClient();

  if (intent === "clear-cache") {
    await supabase.from("app_settings").delete().in("key", ["fmpMatchesCache", "rfepMatchesCache", "federationsUnifiedCache"]);
    return { ok: "Cache de federaciones limpiada." };
  }

  if (intent === "run-diagnostics") {
    const started = Date.now();
    const [fmp, rfep, unified] = await Promise.allSettled([
      fetchFmpRivasNext7DaysMatches(true),
      fetchRivasRfepMatchesNext7Days(),
      getRivasOfficialMatches("", true, { forceRefresh: true }),
    ]);
    const durationMs = Date.now() - started;
    const diagnostics = [
      `FMP: ${fmp.status === "fulfilled" ? `${fmp.value.length} partidos` : "ERROR"}`,
      `RFEP: ${rfep.status === "fulfilled" ? `${rfep.value.length} partidos` : "ERROR"}`,
      `Unificado: ${unified.status === "fulfilled" ? `${unified.value.length} partidos` : "ERROR"}`,
      `Duracion: ${durationMs} ms`,
    ].join(" | ");

    const checkedAt = new Date().toISOString();
    await supabase
      .from("federation_settings")
      .update({
        last_status: fmp.status === "fulfilled" ? "ok" : "error",
        last_error: fmp.status === "fulfilled" ? null : "FMP no disponible",
        last_checked_at: checkedAt,
      })
      .eq("source", "fmp");
    await supabase
      .from("federation_settings")
      .update({
        last_status: rfep.status === "fulfilled" ? "ok" : "error",
        last_error: rfep.status === "fulfilled" ? null : "RFEP no disponible",
        last_checked_at: checkedAt,
      })
      .eq("source", "rfep");

    await supabase.from("operation_logs").insert({
      user_id: session.userId,
      operation_type: "federations_diagnostics",
      status: "ok",
      metadata: sanitizeForLog({ diagnostics }),
    });

    return { ok: "Diagnostico completado.", diagnostics };
  }

  const fmpUrl = String(formData.get("fmpUrl") ?? "").trim();
  const fmpBaseUrl = String(formData.get("fmpBaseUrl") ?? "").trim();
  const fmpPrimaryToken = String(formData.get("fmpPrimaryToken") ?? "RIVAS").trim() || "RIVAS";
  const fmpAliases = String(formData.get("fmpAliases") ?? "").trim();
  const rfepUrl = String(formData.get("rfepUrl") ?? "").trim();
  const rfepBaseUrl = String(formData.get("rfepBaseUrl") ?? "").trim();
  const rfepPrimaryToken = String(formData.get("rfepPrimaryToken") ?? "RIVAS").trim() || "RIVAS";
  const rfepAliases = String(formData.get("rfepAliases") ?? "").trim();
  const defaultRangeDays = Number(formData.get("defaultRangeDays") ?? "7");
  const fmpActive = formData.get("fmpActive") === "on";
  const rfepActive = formData.get("rfepActive") === "on";

  if ((fmpActive && !fmpUrl) || (rfepActive && !rfepUrl)) {
    return { error: "Si una fuente esta activa, su URL es obligatoria." };
  }

  const sources: FederationSourceConfig[] = [
    {
      source: "fmp",
      url: fmpUrl,
      baseUrl: fmpBaseUrl || "https://sidgad.cloud/shared/portales_files/agenda_portales.php",
      defaultRangeDays,
      clubPrimaryToken: fmpPrimaryToken,
      preferredAliases: splitCsvAliases(fmpAliases, "CP RIVAS LAS LAGUNAS"),
      active: fmpActive,
    },
    {
      source: "rfep",
      url: rfepUrl,
      baseUrl: rfepBaseUrl || "https://www.server2.sidgad.es/rfep",
      defaultRangeDays,
      clubPrimaryToken: rfepPrimaryToken,
      preferredAliases: splitCsvAliases(rfepAliases, "ADISS HOCKEY RIVAS"),
      active: rfepActive,
    },
  ];

  await saveFederationSourcesConfig(sources);

  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    operation_type: "save_federations_settings",
    status: "ok",
    metadata: sanitizeForLog({ sources }),
  });

  return { ok: "Configuracion federaciones guardada." };
}

function splitCsvAliases(input: string, fallback: string): string[] {
  const values = input.split(",").map((item) => item.trim()).filter(Boolean);
  if (values.length === 0) return [fallback];
  return values;
}
