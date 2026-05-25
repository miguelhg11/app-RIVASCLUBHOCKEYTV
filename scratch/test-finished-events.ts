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

async function testQueries() {
  console.log("Starting finished-events queries verification...");

  // 1. Get first active user or admin in DB to test with
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("active", true)
    .limit(1);

  if (userErr || !users || users.length === 0) {
    console.error("No active users found to test queries with.");
    return;
  }

  const testUser = users[0];
  console.log(`Testing with user: ${testUser.name} (${testUser.email}), Role: ${testUser.role}`);

  // Test Season Listing Logic
  console.log("\n--- Testing listMySeasons logic ---");
  let seasonRows: any[] = [];
  if (testUser.role === "admin") {
    console.log("User is admin. Fetching all seasons...");
    const { data, error } = await supabase
      .from("seasons")
      .select("id, name, start_year")
      .order("start_year", { ascending: false });
    
    if (error) throw error;
    seasonRows = data || [];
  } else {
    console.log("User is standard. Fetching linked seasons...");
    const { data: utRows, error: utErr } = await supabase
      .from("user_teams")
      .select("team_id")
      .eq("user_id", testUser.id);

    if (utErr) throw utErr;
    console.log(`User linked to ${utRows?.length || 0} teams.`);
    
    if (utRows && utRows.length > 0) {
      const teamIds = utRows.map(r => r.team_id);
      const { data: teamRows, error: teamErr } = await supabase
        .from("teams")
        .select("season_id")
        .in("id", teamIds);
      
      if (teamErr) throw teamErr;
      const seasonIds = Array.from(new Set(teamRows.map(r => r.season_id).filter(Boolean)));
      console.log(`Found ${seasonIds.length} seasons.`);
      
      if (seasonIds.length > 0) {
        const { data, error } = await supabase
          .from("seasons")
          .select("id, name, start_year")
          .in("id", seasonIds)
          .order("start_year", { ascending: false });
        if (error) throw error;
        seasonRows = data || [];
      }
    }
  }

  console.log(`Seasons listed successfully: ${seasonRows.length} seasons found.`);
  seasonRows.forEach(s => console.log(`- Temporada ${s.name} (ID: ${s.id})`));

  // Test finished events listing logic
  if (seasonRows.length > 0) {
    const selectedSeasonId = seasonRows[0].id;
    console.log(`\n--- Testing listMyFinishedEvents logic for season ID: ${selectedSeasonId} ---`);

    let finishedEvents: any[] = [];
    if (testUser.role === "admin") {
      console.log("Admin listing all complete broadcasts in season...");
      const { data, error } = await supabase
        .from("broadcasts")
        .select("id, title, scheduled_start, youtube_watch_url, teams(name)")
        .eq("season_id", selectedSeasonId)
        .eq("youtube_life_cycle_status", "complete")
        .is("deleted_at", null)
        .order("scheduled_start", { ascending: false });
      
      if (error) throw error;
      finishedEvents = data || [];
    } else {
      console.log("User listing linked complete broadcasts in season...");
      const { data: utRows } = await supabase
        .from("user_teams")
        .select("team_id")
        .eq("user_id", testUser.id);
      
      const teamIds = (utRows || []).map(r => r.team_id);
      if (teamIds.length > 0) {
        const { data, error } = await supabase
          .from("broadcasts")
          .select("id, title, scheduled_start, youtube_watch_url, teams(name)")
          .eq("season_id", selectedSeasonId)
          .in("team_id", teamIds)
          .eq("youtube_life_cycle_status", "complete")
          .is("deleted_at", null)
          .order("scheduled_start", { ascending: false });
        if (error) throw error;
        finishedEvents = data || [];
      }
    }

    console.log(`Finished events query completed successfully. Found: ${finishedEvents.length} events.`);
    finishedEvents.forEach(e => {
      const team = Array.isArray(e.teams) ? e.teams[0] : e.teams;
      console.log(`- [${team?.name || "-"}] ${e.title} (Scheduled: ${e.scheduled_start}, Link: ${e.youtube_watch_url || "none"})`);
    });
  }

  console.log("\nFinished events queries verification passed successfully!");
}

testQueries().catch(console.error);
