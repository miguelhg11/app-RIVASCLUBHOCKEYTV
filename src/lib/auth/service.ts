import "server-only";

import bcrypt from "bcrypt";
import type { Role } from "@/src/lib/auth/roles";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name: string;
  passwordHash: string;
  active: boolean;
};

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,email,role,name,password_hash,active")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role as Role,
    name: data.name,
    passwordHash: data.password_hash,
    active: data.active,
  };
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function updateLastLogin(userId: string) {
  const supabase = getSupabaseServerClient();
  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
}
