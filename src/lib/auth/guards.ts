import "server-only";

import { redirect } from "next/navigation";
import { ROLES } from "@/src/lib/auth/roles";
import { getSession } from "@/src/lib/auth/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== ROLES.admin) {
    redirect("/dashboard");
  }
  return session;
}
