import fs from "node:fs";
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

const { data: user, error: userErr } = await supabase
  .from("users")
  .select("id,name,email,role,active")
  .eq("email", "rubendelamogalan@gmail.com")
  .maybeSingle();

if (userErr || !user) {
  console.error("User not found or error:", userErr);
  process.exit(1);
}

console.log("USER:", user);

const { data: userTeams, error: utErr } = await supabase
  .from("user_teams")
  .select("team_id, teams(id, name, active, season_id, team_stream_keys(stream_key_id, stream_keys(name, active)), team_playlists(playlist_id, playlists(name, active)))")
  .eq("user_id", user.id);

if (utErr) {
  console.error("Error fetching user teams:", utErr);
  process.exit(1);
}

console.log("ASSIGNED TEAMS AND RESOURCES:");
console.log(JSON.stringify(userTeams, null, 2));
