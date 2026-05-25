import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Role } from "@/src/lib/auth/roles";

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

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = sign(body);
  return `${body}.${sig}`;
}

function decode(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  if (parsed.exp <= Date.now()) return null;
  return parsed;
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const exp = Date.now() + 1000 * 60 * 60 * 8;
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

export const getSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
});
