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
  console.log("Populating database with test data...");

  const userId = "e82fc859-0ea2-4c01-925c-d1c0386c7915"; // Admin Inicial
  const standardUserId = "3d78d4d6-0c9f-49bd-8dc8-ad57dfb052f4"; // Test Recovery User

  // 1. Get or Create Season
  let { data: season } = await supabase.from("seasons").select("*").limit(1).maybeSingle();
  if (!season) {
    console.log("Inserting test season...");
    const { data, error } = await supabase
      .from("seasons")
      .insert({ name: "2025-2026", start_year: 2025, end_year: 2026 })
      .select("*")
      .single();
    if (error) throw error;
    season = data;
  }
  console.log(`Using Season: ${season.name} (ID: ${season.id})`);

  // 2. Get or Create Category
  let { data: category } = await supabase.from("categories").select("*").limit(1).maybeSingle();
  if (!category) {
    console.log("Inserting test category...");
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: "Juvenil", sort_order: 1 })
      .select("*")
      .single();
    if (error) throw error;
    category = data;
  }
  console.log(`Using Category: ${category.name} (ID: ${category.id})`);

  // 3. Create Team
  console.log("Inserting test team...");
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({
      name: "Rivas Juvenil A",
      display_name: "Rivas Juvenil A",
      category_id: category.id,
      season_id: season.id,
      letter: "A",
      active: true
    })
    .select("*")
    .maybeSingle();

  if (teamErr || !team) {
    console.log("Team might already exist or failed to insert:", teamErr?.message);
  }
  
  // Retrieve the team if it already existed
  const { data: finalTeam } = await supabase
    .from("teams")
    .select("*")
    .eq("name", "Rivas Juvenil A")
    .eq("season_id", season.id)
    .single();
  console.log(`Using Team: ${finalTeam.name} (ID: ${finalTeam.id})`);

  // 4. Link Users to the Team in user_teams
  console.log("Linking users to the team...");
  await supabase.from("user_teams").upsert([
    { user_id: userId, team_id: finalTeam.id },
    { user_id: standardUserId, team_id: finalTeam.id }
  ]);
  console.log("Users linked successfully.");

  // 5. Get or Create Stream Key
  let { data: streamKey } = await supabase.from("stream_keys").select("*").limit(1).maybeSingle();
  if (!streamKey) {
    console.log("Inserting test stream key...");
    const { data, error } = await supabase
      .from("stream_keys")
      .insert({
        name: "Test Stream Key",
        youtube_live_stream_id: "test-stream-id",
        stream_key: "test-stream-key",
        rtmp_url: "rtmp://localhost/live",
        active: true
      })
      .select("*")
      .single();
    if (error) throw error;
    streamKey = data;
  }
  console.log(`Using Stream Key: ${streamKey.name} (ID: ${streamKey.id})`);

  // 6. Create a Completed Broadcast (Finished Event)
  console.log("Inserting completed broadcast (Finished Event)...");
  const { error: completeErr } = await supabase.from("broadcasts").insert({
    title: "JUVENIL: V.D. EUROPA - RIVAS B (Grabación)",
    scheduled_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    youtube_life_cycle_status: "complete",
    youtube_sync_status: "synced",
    youtube_watch_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    created_by: userId,
    team_id: finalTeam.id,
    season_id: season.id,
    stream_key_id: streamKey.id,
    home_team_name: "V.D. Europa",
    away_team_name: "Rivas B"
  });
  if (completeErr) {
    console.error("Error inserting completed broadcast:", completeErr.message);
  } else {
    console.log("Completed broadcast inserted successfully.");
  }

  // 7. Create a Pending Broadcast (Active / Upcoming)
  console.log("Inserting pending broadcast...");
  const { error: pendingErr } = await supabase.from("broadcasts").insert({
    title: "JUVENIL: RIVAS A - TRES CANTOS",
    scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in future
    youtube_life_cycle_status: "ready",
    youtube_sync_status: "synced",
    youtube_watch_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    created_by: userId,
    team_id: finalTeam.id,
    season_id: season.id,
    stream_key_id: streamKey.id,
    home_team_name: "Rivas A",
    away_team_name: "Tres Cantos"
  });
  if (pendingErr) {
    console.error("Error inserting pending broadcast:", pendingErr.message);
  } else {
    console.log("Pending broadcast inserted successfully.");
  }

  console.log("\nDatabase populated successfully!");
}

main().catch(console.error);
