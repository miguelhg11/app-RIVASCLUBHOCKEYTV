import "server-only";

import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import type { FmpMatch } from "@/src/lib/federations/fmp/types";
import { parseFmpTable } from "@/src/lib/federations/fmp/parser";
import { FmpUnavailableError } from "@/src/lib/federations/fmp/errors";
import { sanitizeForLog } from "@/src/lib/logging/sanitize";

const CACHE_TTL_MINUTES = 15;
const REQUEST_TIMEOUT_MS = 10000;

type FmpCacheData = {
  expiresAt: string;
  matches: FmpMatch[];
};

export async function fetchFmpRivasNext7DaysMatches(forceRefresh = false): Promise<FmpMatch[]> {
  const supabase = getSupabaseServerClient();
  const now = new Date();

  // 1. Check database cache first, unless forceRefresh is requested
  if (!forceRefresh) {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "fmpMatchesCache")
        .maybeSingle();

      if (data?.value) {
        const cache = data.value as FmpCacheData;
        const expiresAt = new Date(cache.expiresAt);
        if (expiresAt > now && Array.isArray(cache.matches)) {
          return cache.matches;
        }
      }
    } catch {
      // If cache read fails, proceed with fetching
    }
  }

  // 2. Fetch from FMP Sidgad endpoint
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://sidgad.cloud/shared/portales_files/agenda_portales.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        cliente: "fmp",
        idm: "1",
        id_temp: "21",
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new FmpUnavailableError(`FMP responded with status ${response.status}`);
    }

    const html = await response.text();
    const durationMs = Date.now() - startTime;

    // 3. Parse HTML to matches
    const matches = parseFmpTable(html);

    // 4. Save to database cache
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    const cacheValue: FmpCacheData = {
      expiresAt,
      matches,
    };

    await supabase.from("app_settings").upsert(
      { key: "fmpMatchesCache", value: cacheValue, updated_at: now.toISOString() },
      { onConflict: "key" }
    );

    // 5. Register operation log (Success)
    await supabase.from("operation_logs").insert({
      operation_type: "fmp_fetch_matches",
      status: matches.length > 0 ? "success" : "empty",
      message: `Fetched ${matches.length} matches from FMP`,
      metadata: sanitizeForLog({
        filters: {
          modalidad: "HOCKEY PATINES",
          rangoFecha: "PROXIMOS_7_DIAS",
          club: "HOCKEY RIVAS LAS LAGUNAS HC",
          pista: null,
        },
        matchesFound: matches.length,
        durationMs,
        strategy: "endpoint",
        errorCode: null,
      }),
    });

    return matches;
  } catch (error) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const isAbort = error instanceof Error && error.name === "AbortError";
    const errorCode = isAbort ? "TIMEOUT" : (error instanceof Error ? error.message : "UNKNOWN_ERROR");

    // Register operation log (Failure)
    try {
      await supabase.from("operation_logs").insert({
        operation_type: "fmp_fetch_matches",
        status: "failed",
        message: `Failed to fetch matches from FMP: ${errorCode}`,
        metadata: sanitizeForLog({
          filters: {
            modalidad: "HOCKEY PATINES",
            rangoFecha: "PROXIMOS_7_DIAS",
            club: "HOCKEY RIVAS LAS LAGUNAS HC",
            pista: null,
          },
          matchesFound: 0,
          durationMs,
          strategy: "endpoint",
          errorCode,
        }),
      });
    } catch {
      // Ignore database logging failure
    }

    throw new FmpUnavailableError(
      isAbort 
        ? "El servidor de la FMP tardo demasiado en responder. Intentalo de nuevo o introduce los datos manualmente." 
        : "No se han podido cargar partidos desde FMP. Puedes introducir los datos manualmente."
    );
  }
}
