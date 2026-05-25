import "server-only";

import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export interface Season {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  created_at: string;
  updated_at: string;
}

const SEASON_COOKIE = "active_season_id";

/**
 * Calcula el nombre de la temporada en base a la regla del 15 de julio.
 * - Inicia en septiembre del año de inicio y acaba en junio del año siguiente.
 * - El reset se realiza el 15 de julio de cada año.
 */
export function getCurrentSeasonName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Enero, 6 = Julio, 11 = Diciembre
  const day = date.getDate();

  // Si es antes del 15 de Julio, pertenece a la temporada que empezó el año pasado
  if (month < 6 || (month === 6 && day < 15)) {
    return `${year - 1}-${year}`;
  } else {
    // Si es del 15 de Julio en adelante, pertenece a la temporada que empieza este año
    return `${year}-${year + 1}`;
  }
}

/**
 * Obtiene o crea la temporada actual en la base de datos.
 */
export async function getOrCreateCurrentSeason(): Promise<Season> {
  const name = getCurrentSeasonName();
  const parts = name.split("-");
  const startYear = parseInt(parts[0], 10);
  const endYear = parseInt(parts[1], 10);

  const supabase = getSupabaseServerClient();

  // Buscar temporada
  const { data: existing, error: fetchError } = await supabase
    .from("seasons")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching current season:", fetchError.message);
  }

  if (existing) {
    return existing as Season;
  }

  // Si no existe, crearla
  const { data: inserted, error: insertError } = await supabase
    .from("seasons")
    .insert({
      name,
      start_year: startYear,
      end_year: endYear,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("Error inserting current season:", insertError.message);
    throw new Error("No se pudo inicializar la temporada actual.");
  }

  return inserted as Season;
}

/**
 * Obtiene la temporada seleccionada de la cookie active_season_id.
 * Si no hay cookie o la temporada no existe, devuelve la actual.
 */
export async function getSelectedSeason(): Promise<Season> {
  const jar = await cookies();
  const seasonId = jar.get(SEASON_COOKIE)?.value;
  const supabase = getSupabaseServerClient();

  if (seasonId) {
    const { data: season, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", seasonId)
      .maybeSingle();

    if (!error && season) {
      return season as Season;
    }
  }

  // Devolver por defecto la actual
  const currentSeason = await getOrCreateCurrentSeason();

  // Opcionalmente podemos setear la cookie para futuras peticiones
  // (Nota: no se puede setear cookies si getSelectedSeason se llama durante el render,
  // por lo que simplemente devolvemos el objeto y dejamos que el usuario lo cambie vía Server Action si lo desea)
  return currentSeason;
}

/**
 * Obtiene todas las temporadas para el listado selector.
 */
export async function listAllSeasons(): Promise<Season[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .order("start_year", { ascending: false });

  if (error) {
    console.error("Error listing seasons:", error.message);
    return [];
  }

  return data as Season[];
}
