"use server";

import { redirect } from "next/navigation";
import { ROLES } from "@/src/lib/auth/roles";
import { clearSessionCookie, setSessionCookie } from "@/src/lib/auth/session";
import { findUserByEmail, updateLastLogin, verifyPassword } from "@/src/lib/auth/service";
import { loginSchema } from "@/src/lib/validation/auth";

export type LoginActionState = {
  error?: string;
};

export async function loginAction(_prev: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Credenciales no validas." };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !user.active) {
    return { error: "Credenciales no validas." };
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return { error: "Credenciales no validas." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  await updateLastLogin(user.id);

  if (user.role === ROLES.admin) {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
