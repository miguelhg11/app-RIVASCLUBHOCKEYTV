"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/src/lib/auth/guards";
import { sanitizeForLog } from "@/src/lib/logging/sanitize";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { getSelectedSeason } from "@/src/lib/seasons/utils";
import { sendWelcomeEmail, sendAdminPasswordResetEmail } from "@/src/lib/email/service";
import {
  createYouTubeLiveStream,
  createYouTubePlaylist,
  deleteYouTubeLiveStream,
  deleteYouTubePlaylist,
  updateYouTubeLiveStreamTitle,
  updateYouTubePlaylist,
} from "@/src/lib/youtube/service";
import {
  adminUserSchema,
  categorySchema,
  playlistSchema,
  streamKeySchema,
  teamSchema,
  thumbnailBackgroundSchema,
} from "@/src/lib/validation/admin";

type AdminActionState = {
  error?: string;
  ok?: string;
};

const assignmentSchema = z.object({
  userId: z.uuid(),
  resourceType: z.enum(["team", "playlist"]),
  resourceId: z.uuid(),
  mode: z.enum(["assign", "unassign"]),
});

const teamStreamKeyAssignmentSchema = z.object({
  teamId: z.uuid(),
  streamKeyId: z.uuid(),
  mode: z.enum(["assign", "unassign"]),
});

const activeToggleSchema = z.object({
  target: z.enum(["user", "stream_key", "playlist", "thumbnail_background"]),
  id: z.uuid(),
  active: z.enum(["true", "false"]),
});

const updateCategorySchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(80),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

const updateTeamSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(2).max(120).optional()),
  letter: z.enum(["A", "B", "C", "D", "none"]).default("none"),
  displayName: z.string().trim().max(120).optional(),
  federationScope: z.enum(["fmp", "rfep", "manual"]).optional().default("manual"),
  federationTeamName: z.string().trim().max(120).optional(),
});

const updateUserSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(["admin", "user"]),
});

const updateStreamKeySchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(120),
  youtubeLiveStreamId: z.string().trim().min(5).max(255),
  streamKey: z.string().trim().min(5).max(255),
  rtmpUrl: z.string().trim().url(),
});

const updatePlaylistSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(120),
  youtubePlaylistId: z.string().trim().min(5).max(255),
  description: z.string().trim().max(400).optional(),
});

const updateThumbnailBackgroundSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(120),
  urlPath: z.string().trim().min(1).max(400),
});

const resetPasswordSchema = z.object({
  id: z.uuid(),
  password: z.string().min(8).max(128),
});

const deleteCategorySchema = z.object({ id: z.uuid() });
const deleteTeamSchema = z.object({ id: z.uuid() });
const deleteResourceSchema = z.object({ id: z.uuid() });

export async function createCategoryAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    return { error: "Nombre de categoria no valido." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    sort_order: parsed.data.sortOrder ?? 999,
  });

  if (error) {
    await writeAdminLog("create_category", "failed", sanitizeForLog({ reason: error.message }));
    return { error: "No se pudo crear la categoria." };
  }

  await writeAdminLog("create_category", "ok", { name: parsed.data.name });
  await revalidateAllResourcePaths();
  return { ok: "Categoria creada." };
}

export async function createTeamAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const season = await getSelectedSeason();

  const parsed = teamSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    letter: formData.get("letter") || "none",
    displayName: formData.get("displayName") || undefined,
    federationScope: formData.get("federationScope") || undefined,
    federationTeamName: formData.get("federationTeamName") || undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return { error: firstIssue ? `Datos de equipo no validos: ${firstIssue}` : "Datos de equipo no validos." };
  }

  const streamKeyIds = formData.getAll("streamKeyIds").map(String).filter(Boolean);
  const playlistIds = formData.getAll("playlistIds").map(String).filter(Boolean);

  const supabase = getSupabaseServerClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();

  if (!category) {
    return { error: "La categoria seleccionada no existe. Crea una categoria primero." };
  }

  const { data: categoryNameRow } = await supabase
    .from("categories")
    .select("name")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();

  const letter = parsed.data.letter === "none" ? null : parsed.data.letter;
  const generatedName = `${categoryNameRow?.name ?? "Equipo"}${letter ? ` ${letter}` : ""}`;
  const teamName = parsed.data.name?.trim() ? parsed.data.name : generatedName;

  const { data: teamInserted, error } = await supabase
    .from("teams")
    .insert({
      season_id: season.id,
      category_id: parsed.data.categoryId,
      name: teamName,
      letter,
      active: true,
      display_name: parsed.data.displayName || null,
      federation_scope: parsed.data.federationScope,
      federation_team_name: parsed.data.federationTeamName || null,
    })
    .select("id")
    .maybeSingle();

  if (error || !teamInserted) {
    await writeAdminLog("create_team", "failed", sanitizeForLog({ reason: error?.message || "No se pudo recuperar el ID del equipo insertado." }));
    if (error && /duplicate key|unique/i.test(error.message)) {
      return { error: "Ya existe un equipo con esa categoria/letra o nombre. Revisa duplicados." };
    }
    return { error: `No se pudo crear el equipo. Detalle: ${error?.message || "Error desconocido"}` };
  }

  // Insertar asignaciones de stream keys exclusivas (Opción A)
  for (const streamKeyId of streamKeyIds) {
    await supabase.from("team_stream_keys").delete().eq("stream_key_id", streamKeyId);
    await supabase.from("team_stream_keys").insert({ team_id: teamInserted.id, stream_key_id: streamKeyId });
  }

  // Insertar asignaciones de playlists
  if (playlistIds.length > 0) {
    try {
      const inserts = playlistIds.map((pid) => ({ team_id: teamInserted.id, playlist_id: pid }));
      await supabase.from("team_playlists").insert(inserts);
    } catch {
      // no-op if table does not exist
    }
  }

  await writeAdminLog("create_team", "ok", {
    categoryId: parsed.data.categoryId,
    name: teamName,
    streamKeysAssigned: streamKeyIds.length,
    playlistsAssigned: playlistIds.length,
  });
  await revalidateAllResourcePaths();
  return { ok: "Equipo creado y recursos asociados." };
}

export async function createAdminUserAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = adminUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Datos de usuario no validos." };
  }

  const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);

  const generatedPassword = generateSecureInitialPassword();
  const passwordHash = await bcrypt.hash(generatedPassword, 12);
  const supabase = getSupabaseServerClient();
  const { data: insertedUser, error } = await supabase
    .from("users")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      password_hash: passwordHash,
      role: parsed.data.role,
      active: true,
    })
    .select("id")
    .maybeSingle();

  if (error || !insertedUser) {
    await writeAdminLog("create_user", "failed", sanitizeForLog({ reason: error?.message || "No se pudo recuperar el ID del usuario insertado.", email: parsed.data.email }));
    return { error: "No se pudo crear el usuario." };
  }

  // Asignar equipos
  if (teamIds.length > 0) {
    const userTeams = teamIds.map((tId) => ({ user_id: insertedUser.id, team_id: tId }));
    await supabase.from("user_teams").insert(userTeams);
  }

  await writeAdminLog("create_user", "ok", {
    email: parsed.data.email,
    role: parsed.data.role,
    teamsAssigned: teamIds.length,
  });

  let welcomeEmailSent = false;
  try {
    welcomeEmailSent = await sendWelcomeEmail(parsed.data.email, generatedPassword, parsed.data.name);
  } catch (emailErr) {
    console.error("Failed to send welcome email:", emailErr);
  }

  await revalidateAllResourcePaths();
  if (welcomeEmailSent) {
    return { ok: `Usuario creado. Password inicial: ${generatedPassword} (enviada por email)` };
  }

  return {
    ok: `Usuario creado, pero no se pudo enviar email. Password temporal para entregar manualmente: ${generatedPassword}`,
  };
}

export async function createStreamKeyAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = streamKeySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: "Datos de stream key no validos." };
  }

  let youtubeCreated: {
    youtubeLiveStreamId: string;
    streamKey: string;
    rtmpUrl: string;
  };

  try {
    youtubeCreated = await createYouTubeLiveStream({ title: parsed.data.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error YouTube";
    await writeAdminLog("create_stream_key", "failed", sanitizeForLog({ reason: message, source: "youtube" }));
    return { error: `YouTube no permitio crear la stream key: ${message}` };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("stream_keys").insert({
    name: parsed.data.name,
    youtube_live_stream_id: youtubeCreated.youtubeLiveStreamId,
    stream_key: youtubeCreated.streamKey,
    rtmp_url: youtubeCreated.rtmpUrl,
    active: true,
  });

  if (error) {
    try {
      await deleteYouTubeLiveStream({ youtubeLiveStreamId: youtubeCreated.youtubeLiveStreamId });
    } catch {
      // no-op: log the main DB error below
    }
    await writeAdminLog("create_stream_key", "failed", sanitizeForLog({ reason: error.message }));
    return { error: "No se pudo crear la stream key." };
  }

  await writeAdminLog("create_stream_key", "ok", {
    name: parsed.data.name,
    youtubeLiveStreamId: youtubeCreated.youtubeLiveStreamId,
  });
  await revalidateAllResourcePaths();
  return { ok: "Stream key creada en YouTube y app." };
}

export async function createPlaylistAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = playlistSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: "Datos de playlist no validos." };
  }

  let youtubeCreated: {
    youtubePlaylistId: string;
    description: string;
  };

  try {
    youtubeCreated = await createYouTubePlaylist({
      title: parsed.data.name,
      description: parsed.data.description,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error YouTube";
    await writeAdminLog("create_playlist", "failed", sanitizeForLog({ reason: message, source: "youtube" }));
    return { error: `YouTube no permitio crear la playlist: ${message}` };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("playlists").insert({
    name: parsed.data.name,
    youtube_playlist_id: youtubeCreated.youtubePlaylistId,
    description: youtubeCreated.description || null,
    active: true,
  });

  if (error) {
    try {
      await deleteYouTubePlaylist({ youtubePlaylistId: youtubeCreated.youtubePlaylistId });
    } catch {
      // no-op: log the main DB error below
    }
    await writeAdminLog("create_playlist", "failed", sanitizeForLog({ reason: error.message }));
    return { error: "No se pudo crear la playlist." };
  }

  await writeAdminLog("create_playlist", "ok", { name: parsed.data.name, youtubePlaylistId: youtubeCreated.youtubePlaylistId });
  await revalidateAllResourcePaths();
  return { ok: "Playlist creada en YouTube y app." };
}

export async function createThumbnailBackgroundAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const urlPath = String(formData.get("urlPath") || "").trim();
  const base64Data = String(formData.get("base64Data") || "").trim();
  const isDefault = formData.get("isDefault") === "true";

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const supabase = getSupabaseServerClient();

  if (isDefault) {
    // Unset current default background
    await supabase.from("thumbnail_backgrounds").update({ is_default: false }).eq("is_default", true);
  }

  const { error } = await supabase.from("thumbnail_backgrounds").insert({
    name,
    url_path: urlPath || "base64",
    base64_data: base64Data || null,
    is_default: isDefault,
    active: true,
  });

  if (error) {
    await writeAdminLog("create_thumbnail_background", "failed", sanitizeForLog({ reason: error.message }));
    return { error: `No se pudo crear el fondo: ${error.message}` };
  }

  await writeAdminLog("create_thumbnail_background", "ok", { name, urlPath, isDefault });
  await revalidateAllResourcePaths();
  return { ok: "Fondo creado correctamente." };
}

export async function updateUserAssignmentAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = assignmentSchema.safeParse({
    userId: formData.get("userId"),
    resourceType: formData.get("resourceType"),
    resourceId: formData.get("resourceId"),
    mode: formData.get("mode"),
  });

  if (!parsed.success) {
    return { error: "Asignacion no valida." };
  }

  const mapping = {
    team: { table: "user_teams", field: "team_id", path: "/admin/users" },
    playlist: { table: "user_playlists", field: "playlist_id", path: "/admin/users" },
  } as const;

  const selected = mapping[parsed.data.resourceType];
  const supabase = getSupabaseServerClient();

  if (parsed.data.mode === "assign") {
    const payload: Record<string, string> = {
      user_id: parsed.data.userId,
      [selected.field]: parsed.data.resourceId,
    };

    if (parsed.data.resourceType === "playlist") {
      const season = await getSelectedSeason();
      payload.season_id = season.id;
    }

    const { error } = await supabase.from(selected.table).upsert(payload, { onConflict: `user_id,${selected.field}` });
    if (error) {
      await writeAdminLog("assign_resource", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
      return { error: "No se pudo asignar el recurso." };
    }
    await writeAdminLog("assign_resource", "ok", parsed.data);
    await revalidateAllResourcePaths();
    return { ok: "Recurso asignado." };
  }

  const { error } = await supabase
    .from(selected.table)
    .delete()
    .eq("user_id", parsed.data.userId)
    .eq(selected.field, parsed.data.resourceId);

  if (error) {
    await writeAdminLog("unassign_resource", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo desasignar el recurso." };
  }

  await writeAdminLog("unassign_resource", "ok", parsed.data);
  await revalidateAllResourcePaths();
  return { ok: "Recurso desasignado." };
}

export async function setActiveStatusAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = activeToggleSchema.safeParse({
    target: formData.get("target"),
    id: formData.get("id"),
    active: formData.get("active"),
  });

  if (!parsed.success) {
    return { error: "Operacion no valida." };
  }

  const mapping = {
    user: { table: "users", path: "/admin/users" },
    stream_key: { table: "stream_keys", path: "/admin/stream-keys" },
    playlist: { table: "playlists", path: "/admin/playlists" },
    thumbnail_background: { table: "thumbnail_backgrounds", path: "/admin/thumbnail-backgrounds" },
  } as const;

  const selected = mapping[parsed.data.target];
  const desiredActive = parsed.data.active === "true";
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from(selected.table).update({ active: desiredActive }).eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("set_active_status", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo actualizar el estado." };
  }

  await writeAdminLog("set_active_status", "ok", {
    target: parsed.data.target,
    id: parsed.data.id,
    active: desiredActive,
  });
  await revalidateAllResourcePaths();
  return { ok: "Estado actualizado." };
}

export async function updateCategoryAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: "Categoria no valida." };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name, sort_order: parsed.data.sortOrder })
    .eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("update_category", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo actualizar la categoria." };
  }
  await writeAdminLog("update_category", "ok", parsed.data);
  await revalidateAllResourcePaths();
  return { ok: "Categoria actualizada." };
}

export async function deleteCategoryAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = deleteCategorySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Categoria no valida." };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("delete_category", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo borrar la categoria (puede tener equipos asociados)." };
  }
  await writeAdminLog("delete_category", "ok", parsed.data);
  await revalidateAllResourcePaths();
  return { ok: "Categoria borrada." };
}

export async function updateTeamAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = updateTeamSchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    letter: formData.get("letter") || "none",
    displayName: formData.get("displayName") || undefined,
    federationScope: formData.get("federationScope") || undefined,
    federationTeamName: formData.get("federationTeamName") || undefined,
  });
  if (!parsed.success) return { error: "Equipo no valido." };

  const streamKeyIds = formData.getAll("streamKeyIds").map(String).filter(Boolean);
  const playlistIds = formData.getAll("playlistIds").map(String).filter(Boolean);

  const supabase = getSupabaseServerClient();
  const { data: categoryNameRow } = await supabase
    .from("categories")
    .select("name")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();

  const letter = parsed.data.letter === "none" ? null : parsed.data.letter;
  const generatedName = `${categoryNameRow?.name ?? "Equipo"}${letter ? ` ${letter}` : ""}`;
  const teamName = parsed.data.name?.trim() ? parsed.data.name : generatedName;

  const { error } = await supabase
    .from("teams")
    .update({
      category_id: parsed.data.categoryId,
      name: teamName,
      letter,
      active: true,
      display_name: parsed.data.displayName || null,
      federation_scope: parsed.data.federationScope,
      federation_team_name: parsed.data.federationTeamName || null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    await writeAdminLog("update_team", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    if (/duplicate key|unique/i.test(error.message)) {
      return { error: "Ya existe un equipo con esa categoria/letra o nombre." };
    }
    return { error: `No se pudo actualizar el equipo. Detalle: ${error.message}` };
  }

  // Actualizar asignación de stream keys exclusivas (Opción A)
  await supabase.from("team_stream_keys").delete().eq("team_id", parsed.data.id);
  for (const streamKeyId of streamKeyIds) {
    await supabase.from("team_stream_keys").delete().eq("stream_key_id", streamKeyId);
    await supabase.from("team_stream_keys").insert({ team_id: parsed.data.id, stream_key_id: streamKeyId });
  }

  // Actualizar asignación de playlists
  try {
    await supabase.from("team_playlists").delete().eq("team_id", parsed.data.id);
    if (playlistIds.length > 0) {
      const inserts = playlistIds.map((pid) => ({ team_id: parsed.data.id, playlist_id: pid }));
      await supabase.from("team_playlists").insert(inserts);
    }
  } catch {
    // no-op if table does not exist
  }

  await writeAdminLog("update_team", "ok", {
    ...parsed.data,
    streamKeysAssigned: streamKeyIds.length,
    playlistsAssigned: playlistIds.length,
  });
  await revalidateAllResourcePaths();
  return { ok: "Equipo actualizado y recursos asociados." };
}

export async function deleteTeamAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = deleteTeamSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Equipo no valido." };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("teams").delete().eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("delete_team", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo borrar el equipo (puede tener emisiones o asignaciones)." };
  }
  await writeAdminLog("delete_team", "ok", parsed.data);
  await revalidateAllResourcePaths();
  return { ok: "Equipo borrado." };
}

export async function updateTeamStreamKeyAssignmentAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = teamStreamKeyAssignmentSchema.safeParse({
    teamId: formData.get("teamId"),
    streamKeyId: formData.get("streamKeyId"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) return { error: "Asignacion de stream key no valida." };

  const supabase = getSupabaseServerClient();

  if (parsed.data.mode === "assign") {
    // Limpiar asignaciones previas de esta stream key para garantizar la exclusividad (Opción A)
    const { error: deleteError } = await supabase
      .from("team_stream_keys")
      .delete()
      .eq("stream_key_id", parsed.data.streamKeyId);

    if (deleteError) {
      await writeAdminLog("assign_team_stream_key", "failed", sanitizeForLog({ reason: deleteError.message, ...parsed.data }));
      return { error: "No se pudo limpiar la asignacion previa de la stream key." };
    }

    const { error } = await supabase
      .from("team_stream_keys")
      .upsert({ team_id: parsed.data.teamId, stream_key_id: parsed.data.streamKeyId }, { onConflict: "team_id,stream_key_id" });
    if (error) {
      await writeAdminLog("assign_team_stream_key", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
      return { error: "No se pudo asignar stream key al equipo." };
    }
    await writeAdminLog("assign_team_stream_key", "ok", parsed.data);
    await revalidateAllResourcePaths();
    return { ok: "Stream key asignada al equipo." };
  }

  const { error } = await supabase
    .from("team_stream_keys")
    .delete()
    .eq("team_id", parsed.data.teamId)
    .eq("stream_key_id", parsed.data.streamKeyId);
  if (error) {
    await writeAdminLog("unassign_team_stream_key", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo desasignar stream key del equipo." };
  }

  await writeAdminLog("unassign_team_stream_key", "ok", parsed.data);
  await revalidateAllResourcePaths();
  return { ok: "Stream key desasignada del equipo." };
}

export async function updateUserAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Usuario no valido." };

  const teamIds = formData.getAll("teamIds").map(String).filter(Boolean);

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
    })
    .eq("id", parsed.data.id);

  if (error) {
    await writeAdminLog("update_user", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo actualizar el usuario." };
  }

  const season = await getSelectedSeason();
  const userId = parsed.data.id;

  // Limpiar asignaciones previas de la temporada activa
  const { data: currentSeasonTeams } = await supabase.from("teams").select("id").eq("season_id", season.id);
  const currentSeasonTeamIds = (currentSeasonTeams ?? []).map((t) => t.id);
  if (currentSeasonTeamIds.length > 0) {
    await supabase.from("user_teams").delete().eq("user_id", userId).in("team_id", currentSeasonTeamIds);
  }

  // Insertar nuevas asignaciones
  if (teamIds.length > 0) {
    const userTeams = teamIds.map((tId) => ({ user_id: userId, team_id: tId }));
    await supabase.from("user_teams").insert(userTeams);
  }

  await writeAdminLog("update_user", "ok", {
    ...parsed.data,
    teamsAssignedCount: teamIds.length,
  });
  await revalidateAllResourcePaths();
  return { ok: "Usuario y asignaciones actualizados." };
}

export async function deleteUserAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) return { error: "Falta el identificador del usuario." };

  const supabase = getSupabaseServerClient();

  // Obtener el email del usuario para liberarlo ante futuros registros
  const { data: userRow } = await supabase.from("users").select("email").eq("id", id).maybeSingle();
  if (!userRow) {
    return { error: "No se encontro el usuario." };
  }

  const newEmail = `${userRow.email}.deleted.${Date.now()}`;
  const { error } = await supabase
    .from("users")
    .update({
      active: false,
      email: newEmail,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    await writeAdminLog("delete_user", "failed", sanitizeForLog({ reason: error.message, id }));
    return { error: "No se pudo eliminar el usuario." };
  }

  await writeAdminLog("delete_user", "ok", { id, originalEmail: userRow.email });
  await revalidateAllResourcePaths();
  return { ok: "Usuario eliminado exitosamente." };
}

export async function updateStreamKeyAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = updateStreamKeySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    youtubeLiveStreamId: formData.get("youtubeLiveStreamId"),
    streamKey: formData.get("streamKey"),
    rtmpUrl: formData.get("rtmpUrl"),
  });
  if (!parsed.success) return { error: "Stream key no valida." };

  const supabase = getSupabaseServerClient();
  try {
    await updateYouTubeLiveStreamTitle({
      youtubeLiveStreamId: parsed.data.youtubeLiveStreamId,
      title: parsed.data.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error YouTube";
    await writeAdminLog("update_stream_key_youtube", "failed", sanitizeForLog({ reason: message, ...parsed.data }));
    return { error: `YouTube no permitio actualizar la stream key: ${message}` };
  }

  const { error } = await supabase
    .from("stream_keys")
    .update({
      name: parsed.data.name,
      youtube_live_stream_id: parsed.data.youtubeLiveStreamId,
      stream_key: parsed.data.streamKey,
      rtmp_url: parsed.data.rtmpUrl,
    })
    .eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("update_stream_key", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo actualizar la stream key." };
  }
  await writeAdminLog("update_stream_key", "ok", sanitizeForLog(parsed.data));
  await revalidateAllResourcePaths();
  return { ok: "Stream key actualizada." };
}

export async function updatePlaylistAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = updatePlaylistSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    youtubePlaylistId: formData.get("youtubePlaylistId"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: "Playlist no valida." };

  const supabase = getSupabaseServerClient();
  try {
    await updateYouTubePlaylist({
      youtubePlaylistId: parsed.data.youtubePlaylistId,
      title: parsed.data.name,
      description: parsed.data.description || "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error YouTube";
    await writeAdminLog("update_playlist_youtube", "failed", sanitizeForLog({ reason: message, ...parsed.data }));
    return { error: `YouTube no permitio actualizar la playlist: ${message}` };
  }

  const { error } = await supabase
    .from("playlists")
    .update({
      name: parsed.data.name,
      youtube_playlist_id: parsed.data.youtubePlaylistId,
      description: parsed.data.description || null,
    })
    .eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("update_playlist", "failed", sanitizeForLog({ reason: error.message, ...parsed.data }));
    return { error: "No se pudo actualizar la playlist." };
  }
  await writeAdminLog("update_playlist", "ok", parsed.data);
  await revalidateAllResourcePaths();
  return { ok: "Playlist actualizada." };
}

export async function deleteStreamKeyAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = deleteResourceSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Stream key no valida." };

  const supabase = getSupabaseServerClient();
  const { data: row } = await supabase
    .from("stream_keys")
    .select("id,name,youtube_live_stream_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!row) return { error: "No se encontro la stream key." };

  try {
    await deleteYouTubeLiveStream({ youtubeLiveStreamId: row.youtube_live_stream_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error YouTube";
    await writeAdminLog("delete_stream_key_youtube", "failed", sanitizeForLog({ reason: message, id: parsed.data.id }));
    return { error: `YouTube no permitio borrar la stream key: ${message}` };
  }

  const { error } = await supabase.from("stream_keys").delete().eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("delete_stream_key", "failed", sanitizeForLog({ reason: error.message, id: parsed.data.id }));
    return { error: "No se pudo borrar la stream key local." };
  }

  await writeAdminLog("delete_stream_key", "ok", { id: parsed.data.id, name: row.name });
  await revalidateAllResourcePaths();
  return { ok: "Stream key borrada en YouTube y app." };
}

export async function deletePlaylistAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = deleteResourceSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { error: "Playlist no valida." };

  const supabase = getSupabaseServerClient();
  const { data: row } = await supabase
    .from("playlists")
    .select("id,name,youtube_playlist_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!row) return { error: "No se encontro la playlist." };

  try {
    await deleteYouTubePlaylist({ youtubePlaylistId: row.youtube_playlist_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error YouTube";
    await writeAdminLog("delete_playlist_youtube", "failed", sanitizeForLog({ reason: message, id: parsed.data.id }));
    return { error: `YouTube no permitio borrar la playlist: ${message}` };
  }

  const { error } = await supabase.from("playlists").delete().eq("id", parsed.data.id);
  if (error) {
    await writeAdminLog("delete_playlist", "failed", sanitizeForLog({ reason: error.message, id: parsed.data.id }));
    return { error: "No se pudo borrar la playlist local." };
  }

  await writeAdminLog("delete_playlist", "ok", { id: parsed.data.id, name: row.name });
  await revalidateAllResourcePaths();
  return { ok: "Playlist borrada en YouTube y app." };
}

export async function updateThumbnailBackgroundAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const urlPath = String(formData.get("urlPath") || "").trim();
  const base64Data = String(formData.get("base64Data") || "").trim();
  const isDefault = formData.get("isDefault") === "true";

  if (!id || !name) {
    return { error: "ID y Nombre son obligatorios." };
  }

  const supabase = getSupabaseServerClient();

  if (isDefault) {
    // Unset other default backgrounds first
    await supabase.from("thumbnail_backgrounds").update({ is_default: false }).eq("is_default", true);
  }

  const updatePayload: any = {
    name,
    url_path: urlPath || "base64",
    is_default: isDefault,
  };
  if (base64Data) {
    updatePayload.base64_data = base64Data;
  }

  const { error } = await supabase
    .from("thumbnail_backgrounds")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    await writeAdminLog("update_thumbnail_background", "failed", sanitizeForLog({ reason: error.message, id }));
    return { error: `No se pudo actualizar el fondo: ${error.message}` };
  }

  await writeAdminLog("update_thumbnail_background", "ok", { id, name, urlPath, isDefault });
  await revalidateAllResourcePaths();
  return { ok: "Fondo actualizado correctamente." };
}

export async function resetUserPasswordAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) return { error: "Falta el identificador del usuario." };

  const supabase = getSupabaseServerClient();
  
  // 1. Fetch user email
  const { data: userRow, error: fetchError } = await supabase
    .from("users")
    .select("email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !userRow) {
    return { error: "No se encontro el usuario para restablecer la password." };
  }

  // 2. Generate random password
  const newPassword = generateSecureInitialPassword();
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // 3. Update DB
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", id);

  if (updateError) {
    await writeAdminLog("reset_user_password", "failed", sanitizeForLog({ reason: updateError.message, id }));
    return { error: "No se pudo cambiar la password." };
  }

  // 4. Send email
  let resetEmailSent = false;
  try {
    resetEmailSent = await sendAdminPasswordResetEmail(userRow.email, newPassword);
  } catch (emailErr) {
    console.error("Failed to send admin reset password email:", emailErr);
  }

  await writeAdminLog("reset_user_password", "ok", { id, email: userRow.email });
  await revalidateAllResourcePaths();
  if (resetEmailSent) {
    return { ok: "Contraseña restablecida y enviada por email." };
  }

  return {
    ok: `Contraseña restablecida, pero no se pudo enviar email. Password temporal para entregar manualmente: ${newPassword}`,
  };
}

async function writeAdminLog(operationType: string, status: string, metadata: unknown) {
  const session = await requireAdmin();
  const supabase = getSupabaseServerClient();
  await supabase.from("operation_logs").insert({
    user_id: session.userId,
    operation_type: operationType,
    status,
    metadata: sanitizeForLog(metadata),
  });
}

function generateSecureInitialPassword() {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%&*_-";
  const all = `${lower}${upper}${numbers}${symbols}`;

  const picks = [
    lower[randomIndex(lower.length)],
    upper[randomIndex(upper.length)],
    numbers[randomIndex(numbers.length)],
    symbols[randomIndex(symbols.length)],
  ];
  for (let i = picks.length; i < 14; i += 1) {
    picks.push(all[randomIndex(all.length)]);
  }
  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    const tmp = picks[i];
    picks[i] = picks[j];
    picks[j] = tmp;
  }
  return picks.join("");
}

function randomIndex(maxExclusive: number) {
  const value = randomBytes(4).readUInt32BE(0);
  return value % maxExclusive;
}

export async function revalidateAllResourcePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/users");
  revalidatePath("/admin/stream-keys");
  revalidatePath("/admin/playlists");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/thumbnail-backgrounds");
  revalidatePath("/admin/broadcasts");
  revalidatePath("/admin/federations");
  revalidatePath("/admin/logs");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/live");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/broadcasts");
}
