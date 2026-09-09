import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { ROLES, type Role } from "@/src/lib/auth/roles";
import { getSupabaseServerClient } from "@/src/lib/supabase/server";

const SESSION_COOKIE = "rivas_session";

export type SessionPayload = {
  userId: string;
  role: Role;
  email: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET no configurado");
  }
  return secret;
}

function sign(value: string, secret = getSecret()) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decode(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const secrets = [getSecret(), process.env.SESSION_SECRET_PREVIOUS].filter((value): value is string => Boolean(value));
    const validSignature = secrets.some((secret) => {
      const expected = sign(body, secret);
      return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    });
    if (!validSignature) return null;
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const token = encode({ ...payload, exp });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = decode(token);
  if (!session) return null;

  const { data: user, error } = await getSupabaseServerClient()
    .from("users")
    .select("id,email,role,active,deleted_at")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !user || !user.active || user.deleted_at) return null;
  if (user.role !== ROLES.admin && user.role !== ROLES.user) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as Role,
    exp: session.exp,
  };
}
