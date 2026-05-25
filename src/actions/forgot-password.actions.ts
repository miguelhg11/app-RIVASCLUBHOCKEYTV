"use server";

import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";
import { sendSelfResetPasswordEmail } from "@/src/lib/email/service";
import { revalidatePath } from "next/cache";

export type ForgotPasswordState = {
  error?: string;
  ok?: string;
};

export async function requestPasswordResetAction(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) {
    return { error: "Por favor, introduce tu correo electrónico." };
  }

  const supabase = getSupabaseServerClient();

  // Fetch user
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  // Prevent email enumeration: return success even if user not found or error
  if (fetchError || !user) {
    return { ok: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos." };
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

  // Save token hash to user
  const { error: updateError } = await supabase
    .from("users")
    .update({
      reset_token_hash: tokenHash,
      reset_token_expires_at: expiresAt,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Failed to save reset token hash:", updateError.message);
    return { error: "Ocurrió un error al procesar tu solicitud." };
  }

  // Send email
  try {
    const sent = await sendSelfResetPasswordEmail(user.email, token);
    if (!sent) {
      return { error: "No se pudo enviar el correo de recuperación. Revisa logs." };
    }
  } catch (err) {
    console.error("Error sending self reset password email:", err);
    return { error: "Error enviando el correo de recuperación." };
  }

  return { ok: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos." };
}

export async function resetPasswordWithTokenAction(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const token = String(formData.get("token") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const newPassword = String(formData.get("newPassword") || "").trim();

  if (!token || !email) {
    return { error: "Token o email no válidos." };
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = getSupabaseServerClient();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Find user by email
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, reset_token_hash, reset_token_expires_at")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !user) {
    return { error: "El enlace es inválido, ha expirado o el usuario no existe." };
  }

  // Verify token hash and expiration
  if (!user.reset_token_hash || user.reset_token_hash !== tokenHash) {
    return { error: "El enlace es inválido o ya ha sido utilizado." };
  }

  const expiresTime = new Date(user.reset_token_expires_at).getTime();
  if (Date.now() > expiresTime) {
    return { error: "El enlace ha expirado. Por favor, solicita uno nuevo." };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update password and clear token fields
  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_token_hash: null,
      reset_token_expires_at: null,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Failed to update password during reset:", updateError.message);
    return { error: "No se pudo actualizar la contraseña. Revisa la base de datos." };
  }

  // Log audit
  try {
    await supabase.from("operation_logs").insert({
      user_id: user.id,
      operation_type: "self_password_reset",
      status: "ok",
      message: `Contraseña restablecida exitosamente por el usuario`,
    });
  } catch (logErr) {
    console.error("Failed to write log for self password reset:", logErr);
  }

  return { ok: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." };
}
