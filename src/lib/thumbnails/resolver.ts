import { createClient } from "@supabase/supabase-js";
import { normalizeTeamName, isRivasTeam } from "../federations/shared/club-identity";

// Cliente Supabase server-only (se configuran las variables desde env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Cache en memoria para búsquedas consecutivas y evitar consultas redundantes a Supabase
let badgesCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos de cache

async function getBadges() {
  const now = Date.now();
  if (badgesCache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return badgesCache;
  }

  const { data, error } = await supabase
    .from("club_badges")
    .select("canonical_name, source_scope, aliases, normalized_aliases, logo_url");

  if (error) {
    console.error("Error fetching badges from Supabase:", error.message);
    return badgesCache || []; // devolver cache antigua si falla
  }

  badgesCache = data || [];
  cacheTimestamp = now;
  return badgesCache;
}

export type ResolvedBadge = {
  canonicalName: string;
  logoUrl: string;
  isRivas: boolean;
  matchType: "exact" | "alias" | "partial" | "fallback" | "rivas";
};

export async function resolveBadgeForTeam(teamName: string): Promise<ResolvedBadge> {
  const normalized = normalizeTeamName(teamName);

  // 1. Caso especial: Rivas
  if (isRivasTeam(teamName)) {
    return {
      canonicalName: "CP RIVAS LAS LAGUNAS",
      logoUrl: "/badges/fmp/rivas.png",
      isRivas: true,
      matchType: "rivas",
    };
  }

  const badges = await getBadges();

  // 2. Coincidencia exacta por nombre canónico
  const exactCanonical = badges.find(
    (b) => normalizeTeamName(b.canonical_name) === normalized
  );
  if (exactCanonical) {
    return {
      canonicalName: exactCanonical.canonical_name,
      logoUrl: exactCanonical.logo_url,
      isRivas: false,
      matchType: "exact",
    };
  }

  // 3. Coincidencia exacta por normalized_aliases
  const aliasMatch = badges.find(
    (b) => b.normalized_aliases && b.normalized_aliases.includes(normalized)
  );
  if (aliasMatch) {
    return {
      canonicalName: aliasMatch.canonical_name,
      logoUrl: aliasMatch.logo_url,
      isRivas: false,
      matchType: "alias",
    };
  }

  // 4. Coincidencia parcial (el nombre del equipo contiene un alias o viceversa)
  // Ej: CHP Aluche contiene Aluche, o Alcorcon A contiene Alcorcon
  const partialMatch = badges.find((b) => {
    // Si la insignia en base de datos es Rivas, no la usemos para coincidencia parcial de otros equipos!
    const badgeNameUpper = b.canonical_name.toUpperCase();
    if (badgeNameUpper.includes("RIVAS")) return false;

    return (
      (b.normalized_aliases &&
        b.normalized_aliases.some((alias: string) => {
          // Aseguramos límites de palabra para evitar subcadenas extrañas
          const escapedAlias = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp('\\b' + escapedAlias + '\\b');
          return regex.test(normalized);
        })) ||
      normalizeTeamName(b.canonical_name) === normalized
    );
  });

  if (partialMatch) {
    return {
      canonicalName: partialMatch.canonical_name,
      logoUrl: partialMatch.logo_url,
      isRivas: false,
      matchType: "partial",
    };
  }

  // 5. Fallback a escudo por defecto/placeholder (usamos Aluche u otro, o un escudo vacío/rivas como fallback genérico)
  // Devolvemos el escudo de Rivas como fallback universal solo si no encontramos nada, pero mejor usar un escudo genérico.
  // Como no hay escudo genérico gris, devolvemos '/badges/fmp/rivas.png' pero marcado como fallback.
  // Para evitar que se use el escudo de Rivas para el rival, podemos devolver un escudo vacío o el escudo de Rivas pero identificándolo.
  return {
    canonicalName: teamName || "Rival",
    logoUrl: "/badges/fmp/rivas.png", // logo fallback
    isRivas: false,
    matchType: "fallback",
  };
}

export type BadgeEntry = {
  canonical_name: string;
  logo_url: string;
  normalized_aliases: string[];
};

export type CategorizedBadges = {
  fmp: BadgeEntry[];
  rfep: BadgeEntry[];
  selecciones: BadgeEntry[];
};

export async function getCategorizedBadges(): Promise<CategorizedBadges> {
  const badges = await getBadges();
  
  const mapBadge = (b: any): BadgeEntry => ({
    canonical_name: b.canonical_name,
    logo_url: b.logo_url,
    normalized_aliases: b.normalized_aliases || [],
  });

  const fmp = badges
    .filter((b) => b.source_scope === "fmp")
    .map(mapBadge)
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
    
  const rfep = badges
    .filter((b) => b.source_scope === "rfep")
    .map(mapBadge)
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
    
  const selecciones = badges
    .filter((b) => b.source_scope === "seleccion_autonomica")
    .map(mapBadge)
    .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
    
  return { fmp, rfep, selecciones };
}
