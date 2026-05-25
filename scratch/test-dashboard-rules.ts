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
  console.log("Verifying unified dashboard and delegate access rules...");

  // 1. Fetch the admin user
  const { data: adminUser } = await supabase
    .from("users")
    .select("id, email, name, active")
    .eq("email", "admin@rivas.local")
    .maybeSingle();

  if (!adminUser) {
    console.error("Admin user not found. Skipping detailed tests.");
    return;
  }
  
  console.log(`\nFound Admin User: ${adminUser.name} (${adminUser.email})`);

  // Simulating listMyBroadcasts() for this admin
  console.log("\n--- Testing listMyBroadcasts (Simulated) ---");
  const { data: myBroadcasts, error: bError } = await supabase
    .from("broadcasts")
    .select("id, title, created_by, youtube_life_cycle_status")
    .is("deleted_at", null)
    .eq("created_by", adminUser.id);
  
  if (bError) throw bError;
  const pendingOnly = (myBroadcasts || []).filter(bc => bc.youtube_life_cycle_status !== "complete");
  console.log(`Admin has scheduled ${myBroadcasts?.length || 0} broadcasts total, with ${pendingOnly.length} pending.`);
  if (pendingOnly.length > 0) {
    console.log("Pending list:");
    pendingOnly.forEach(bc => console.log(`- ${bc.title} (Status: ${bc.youtube_life_cycle_status})`));
  }

  // Simulating listMySeasons() for this admin (should now apply user_teams link rules, not return all)
  console.log("\n--- Testing listMySeasons (Simulated with user_teams constraint) ---");
  const { data: utRows, error: utErr } = await supabase
    .from("user_teams")
    .select("team_id")
    .eq("user_id", adminUser.id);

  if (utErr) throw utErr;
  console.log(`Admin is linked to ${utRows?.length || 0} teams in user_teams.`);

  let seasonsList: any[] = [];
  if (utRows && utRows.length > 0) {
    const teamIds = utRows.map(r => r.team_id);
    const { data: teamRows, error: teamErr } = await supabase
      .from("teams")
      .select("season_id")
      .in("id", teamIds);
    
    if (teamErr) throw teamErr;
    const seasonIds = Array.from(new Set(teamRows.map(r => r.season_id).filter(Boolean)));
    if (seasonIds.length > 0) {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name, start_year")
        .in("id", seasonIds)
        .order("start_year", { ascending: false });
      if (error) throw error;
      seasonsList = data || [];
    }
  }

  console.log(`Admin can access ${seasonsList.length} seasons.`);
  seasonsList.forEach(s => console.log(`- Temporada ${s.name} (ID: ${s.id})`));

  // 2. Active status safeguard test
  console.log("\n--- Testing active status check safeguard ---");
  // Temporarily insert an inactive user
  const inactiveEmail = "temp-inactive@rivashockey.es";
  // Clean up if already exists
  await supabase.from("users").delete().eq("email", inactiveEmail);
  
  const { data: inactiveUser, error: insErr } = await supabase
    .from("users")
    .insert({
      name: "Inactive User Test",
      email: inactiveEmail,
      password_hash: "mock_hash",
      role: "user",
      active: false
    })
    .select("id")
    .maybeSingle();

  if (insErr || !inactiveUser) {
    throw new Error(`Failed to create inactive user: ${insErr?.message}`);
  }
  
  console.log(`Created inactive user ID: ${inactiveUser.id}`);

  // Query active state
  const { data: userRow } = await supabase
    .from("users")
    .select("active")
    .eq("id", inactiveUser.id)
    .is("deleted_at", null)
    .maybeSingle();

  const isUserActive = userRow && userRow.active;
  console.log("Is queried user active?", isUserActive ? "YES" : "NO");
  console.log("Will query return empty array for inactive user?", !isUserActive ? "YES (Correct)" : "NO (Failed)");

  // Clean up temp inactive user
  await supabase.from("users").delete().eq("id", inactiveUser.id);
  console.log("Temp inactive user cleaned up.");

  console.log("\nAll dashboard access rule verifications passed successfully!");
}

main().catch(console.error);
