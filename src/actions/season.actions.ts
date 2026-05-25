"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { requireAdmin } from "@/src/lib/auth/guards";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { revalidateAllResourcePaths } from "./admin.actions";

const SEASON_COOKIE = "active_season_id";

const changeSeasonSchema = z.object({
  seasonId: z.string().uuid(),
});

const createSeasonSchema = z.object({
  startYear: z.coerce.number().int(),
});

export async function changeActiveSeasonAction(seasonId: string) {
  const parsed = changeSeasonSchema.safeParse({ seasonId });
  if (!parsed.success) {
    return { error: "Identificador de temporada no valido." };
  }

  const jar = await cookies();
  jar.set(SEASON_COOKIE, parsed.data.seasonId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });

  await revalidateAllResourcePaths();
  return { ok: "Temporada cambiada." };
}

export async function createSeasonAction(_prev: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = createSeasonSchema.safeParse({
    startYear: formData.get("startYear"),
  });

  if (!parsed.success) {
    return { error: "El año de inicio no es valido." };
  }

  const currentRealYear = new Date().getFullYear();
  if (parsed.data.startYear < currentRealYear) {
    return { error: `El año de inicio no puede ser anterior al año real en curso (${currentRealYear}).` };
  }

  const startYear = parsed.data.startYear;
  const endYear = startYear + 1;
  const name = `${startYear}-${endYear}`;

  const supabase = getSupabaseServerClient();

  // Validar si ya existe
  const { data: existing } = await supabase
    .from("seasons")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    return { error: `La temporada ${name} ya existe.` };
  }

  // Insertar
  const { error } = await supabase.from("seasons").insert({
    name,
    start_year: startYear,
    end_year: endYear,
  });

  if (error) {
    console.error("Error creating season:", error.message);
    return { error: "No se pudo crear la temporada." };
  }

  await revalidateAllResourcePaths();
  return { ok: `Temporada ${name} creada exitosamente.` };
}
