import { loadEnvConfig } from "@next/env";
// Load Next.js environment before importing the email service
loadEnvConfig(process.cwd());

import fs from "node:fs";
import path from "node:path";

async function run() {
  const { sendWelcomeEmail, sendAdminPasswordResetEmail, sendSelfResetPasswordEmail } = await import("../src/lib/email/service");
  console.log("Running email service verification tests...");

  // Clean log file if it exists so we start fresh
  const logFile = path.join(process.cwd(), "scratch", "emails.log");
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
    console.log("Deleted old scratch/emails.log");
  }

  // 1. Test Welcome Email
  console.log("1. Sending welcome email...");
  const welcomeOk = await sendWelcomeEmail("test-user@rivashockey.es", "TempPass123!", "Usuario Test");
  console.log("Welcome email status:", welcomeOk ? "Success" : "Failed");

  // 2. Test Admin Password Reset Email
  console.log("2. Sending admin password reset email...");
  const resetOk = await sendAdminPasswordResetEmail("test-user@rivashockey.es", "NewRandomPass456#");
  console.log("Admin password reset status:", resetOk ? "Success" : "Failed");

  // 3. Test Self Service Password Reset Email
  console.log("3. Sending self-service password reset email...");
  const selfResetOk = await sendSelfResetPasswordEmail("test-user@rivashockey.es", "abcd-efgh-1234-5678");
  console.log("Self reset status:", selfResetOk ? "Success" : "Failed");

  // Check if log file exists and display its status
  if (fs.existsSync(logFile)) {
    console.log("\nSuccess: scratch/emails.log was created!");
    const content = fs.readFileSync(logFile, "utf8");
    console.log(`Log size: ${content.length} bytes`);
  } else {
    console.log("\nError: scratch/emails.log was not created.");
  }
}

run().catch(console.error);
