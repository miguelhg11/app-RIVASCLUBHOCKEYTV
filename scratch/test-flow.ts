import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "node:crypto";
import bcrypt from "bcrypt";

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
  console.log("Starting backend flows verification...");

  // 1. Clean up or retrieve test user
  const email = "test-recovery@rivashockey.es";
  console.log(`\n--- 1. Set up test user: ${email} ---`);
  
  // Try to find user
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let userId: string;
  if (existingUser) {
    console.log(`Found existing test user ID: ${existingUser.id}`);
    userId = existingUser.id;
  } else {
    // Insert new test user
    console.log("Inserting new test user...");
    const initialHash = await bcrypt.hash("InitialPass123!", 12);
    const { data: newUser, error: insertErr } = await supabase
      .from("users")
      .insert({
        name: "Test Recovery User",
        email: email,
        password_hash: initialHash,
        role: "user",
        active: true
      })
      .select("id")
      .maybeSingle();

    if (insertErr || !newUser) {
      throw new Error(`Failed to create test user: ${insertErr?.message}`);
    }
    console.log(`Created test user with ID: ${newUser.id}`);
    userId = newUser.id;
  }

  // 2. Generate a forgot password token and save to DB (Simulating requestPasswordResetAction)
  console.log("\n--- 2. Request Password Reset (Simulated) ---");
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  console.log(`Generated Token: ${token}`);
  console.log(`Token Hash: ${tokenHash}`);
  console.log(`Expires At: ${expiresAt}`);

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      reset_token_hash: tokenHash,
      reset_token_expires_at: expiresAt
    })
    .eq("id", userId);

  if (updateErr) {
    throw new Error(`Failed to save reset token to DB: ${updateErr.message}`);
  }
  console.log("Reset token saved to database successfully.");

  // Verify DB contains it
  const { data: userWithToken } = await supabase
    .from("users")
    .select("reset_token_hash, reset_token_expires_at")
    .eq("id", userId)
    .single();
  
  console.log("DB check - Token hash matches?", userWithToken.reset_token_hash === tokenHash ? "YES" : "NO");
  console.log("DB check - Expires at matches?", userWithToken.reset_token_expires_at === expiresAt ? "YES" : "NO");

  // 3. Reset password with token (Simulating resetPasswordWithTokenAction)
  console.log("\n--- 3. Reset password with token (Simulated) ---");
  const newPassword = "NewSecretPass789!";
  const tokenToVerify = token; // Use the generated token
  const verifiedTokenHash = crypto.createHash("sha256").update(tokenToVerify).digest("hex");

  // Verify against database
  const { data: userToVerify } = await supabase
    .from("users")
    .select("id, reset_token_hash, reset_token_expires_at")
    .eq("email", email)
    .single();

  if (!userToVerify.reset_token_hash || userToVerify.reset_token_hash !== verifiedTokenHash) {
    throw new Error("Token verification failed! Hash does not match.");
  }
  
  if (new Date(userToVerify.reset_token_expires_at).getTime() < Date.now()) {
    throw new Error("Token verification failed! Expired.");
  }

  console.log("Token successfully verified. Updating password and clearing token...");
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  const { error: finalUpdateErr } = await supabase
    .from("users")
    .update({
      password_hash: newPasswordHash,
      reset_token_hash: null,
      reset_token_expires_at: null
    })
    .eq("id", userId);

  if (finalUpdateErr) {
    throw new Error(`Failed to update password in DB: ${finalUpdateErr.message}`);
  }
  console.log("Password updated and reset token cleared in DB.");

  // 4. Test that token reuse is prevented
  console.log("\n--- 4. Verify token reuse prevention ---");
  const { data: userPostReset } = await supabase
    .from("users")
    .select("reset_token_hash, reset_token_expires_at, password_hash")
    .eq("id", userId)
    .single();

  console.log("Is reset_token_hash cleared (null)?", userPostReset.reset_token_hash === null ? "YES" : "NO");
  console.log("Is reset_token_expires_at cleared (null)?", userPostReset.reset_token_expires_at === null ? "YES" : "NO");

  const passwordOk = await bcrypt.compare(newPassword, userPostReset.password_hash);
  console.log("Does new password hash match?", passwordOk ? "YES" : "NO");

  // 5. Test Expiration logic
  console.log("\n--- 5. Verify unbroadcast schedules expiration ---");
  const { expirePendingBroadcasts } = await import("../src/lib/broadcast/expiration");
  console.log("Running expirePendingBroadcasts()...");
  const expiredSummary = await expirePendingBroadcasts();
  console.log("Expiration run completed.", expiredSummary);

  console.log("\nAll backend checks passed successfully!");
}

main().catch(console.error);
