import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = [
  ["categories.sort_order", () => probeColumn("categories", "sort_order")],
  ["teams.letter", () => probeColumn("teams", "letter")],
  ["teams.active", () => probeColumn("teams", "active")],
  ["users.phone", () => probeColumn("users", "phone")],
  ["team_stream_keys table", () => probeTable("team_stream_keys")],
  ["team_playlists table", () => probeTable("team_playlists")],
  ["federation_settings table", () => probeTable("federation_settings")],
  ["rfep_leagues table", () => probeTable("rfep_leagues")],
  ["seasons table", () => probeTable("seasons")],
  ["teams.season_id", () => probeColumn("teams", "season_id")],
  ["broadcasts.season_id", () => probeColumn("broadcasts", "season_id")],
  ["user_playlists.season_id", () => probeColumn("user_playlists", "season_id")],
  ["youtube_channel_videos table", () => probeTable("youtube_channel_videos")],
  ["users.reset_token_hash", () => probeColumn("users", "reset_token_hash")],
  ["users.reset_token_expires_at", () => probeColumn("users", "reset_token_expires_at")],
];

let hasErrors = false;
for (const [label, fn] of checks) {
  const ok = await fn();
  if (!ok) hasErrors = true;
  console.log(`${ok ? "OK" : "MISSING"} - ${label}`);
}

if (hasErrors) {
  console.error("Schema drift detected. Apply pending migrations.");
  process.exit(2);
}

console.log("Schema check passed.");

async function probeColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}

async function probeTable(table) {
  const { error } = await supabase.from(table).select("*").limit(1);
  return !error;
}
