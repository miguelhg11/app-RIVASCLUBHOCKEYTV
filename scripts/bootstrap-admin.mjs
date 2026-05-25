import fs from "node:fs";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

function parseEnv(path) {
  const out = {};
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = parseEnv(".env.local");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = "admin@rivas.local";
const password = "AdminRivas2026!";
const passwordHash = await bcrypt.hash(password, 12);

const { data: existing, error: findError } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
if (findError) {
  console.error("ERROR finding user:", findError.message);
  process.exit(1);
}

if (existing?.id) {
  const { error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash, role: "admin", active: true, name: "Admin Inicial" })
    .eq("id", existing.id);
  if (error) {
    console.error("ERROR updating user:", error.message);
    process.exit(1);
  }
  console.log("UPDATED_ADMIN");
} else {
  const { error } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash, role: "admin", name: "Admin Inicial", active: true });
  if (error) {
    console.error("ERROR creating user:", error.message);
    process.exit(1);
  }
  console.log("CREATED_ADMIN");
}

console.log(`EMAIL=${email}`);
console.log(`PASSWORD=${password}`);
