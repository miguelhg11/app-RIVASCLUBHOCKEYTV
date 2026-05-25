"use server";

import bcrypt from "bcrypt";
import { z } from "zod";
import { requireSession } from "@/src/lib/auth/guards";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export type AccountPasswordState = {
  error?: string;
  ok?: string;
};

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "La confirmacion no coincide.",
    path: ["confirmPassword"],
  });

export async function changeOwnPasswordAction(
  _prev: AccountPasswordState,
  formData: FormData,
): Promise<AccountPasswordState> {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Datos no validos." };

  const supabase = getSupabaseServerClient();
  const { data: user } = await supabase.from("users").select("password_hash").eq("id", session.userId).maybeSingle();
  if (!user?.password_hash) return { error: "No se pudo verificar la password actual." };

  const validCurrent = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!validCurrent) return { error: "La password actual no es correcta." };

  const nextHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const { error } = await supabase.from("users").update({ password_hash: nextHash }).eq("id", session.userId);
  if (error) return { error: "No se pudo actualizar la password." };

  return { ok: "Password actualizada." };
}
