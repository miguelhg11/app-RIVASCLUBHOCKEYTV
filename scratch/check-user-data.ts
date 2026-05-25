import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.join(__dirname, "../.env.local");
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars", { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== DB DATA DIAGNOSTICS ===");

  // 1. Fetch all users
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, role, active");

  console.log("\n--- Users in System ---");
  console.log(users);

  // 2. Fetch all user team linkages
  const { data: userTeams } = await supabase
    .from("user_teams")
    .select("user_id, team_id, teams(name, season_id)");

  console.log("\n--- User Team Links ---");
  userTeams?.forEach(ut => {
    const user = users?.find(u => u.id === ut.user_id);
    const team = Array.isArray(ut.teams) ? ut.teams[0] : ut.teams;
    console.log(`User: ${user?.name || "Unknown"} (${user?.email}) -> Team: ${team?.name} (Season ID: ${team?.season_id})`);
  });

  // 3. Fetch all broadcasts and their statuses
  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("id, title, team_id, season_id, youtube_life_cycle_status, deleted_at, scheduled_start");

  console.log("\n--- Broadcasts in System ---");
  broadcasts?.forEach(b => {
    const teamLink = userTeams?.find(ut => ut.team_id === b.team_id);
    const linkedUser = teamLink ? users?.find(u => u.id === teamLink.user_id) : null;
    console.log(`Broadcast: "${b.title}"\n  Team ID: ${b.team_id}\n  Lifecycle Status: ${b.youtube_life_cycle_status}\n  Deleted?: ${b.deleted_at ? "YES" : "NO"}\n  Linked to User?: ${linkedUser ? `${linkedUser.name} (${linkedUser.email})` : "NO"}`);
  });
}

main().catch(console.error);
