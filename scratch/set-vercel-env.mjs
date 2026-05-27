import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of content.split(/\r?\n/)) {
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

const env = loadEnvFile();

// We need to set these env vars
const varsToSet = {
  APP_ENV: "production",
  APP_BASE_URL: "https://rivasyoutubelivehandoff.vercel.app/",
  SESSION_SECRET: env.SESSION_SECRET || "RivasLocalSessionSecret_2026_05_23_mw7K2nQfL8xP4vT1",
  YOUTUBE_MOCK_MODE: "false",
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  YOUTUBE_CLIENT_ID: env.YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET: env.YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REFRESH_TOKEN: env.YOUTUBE_REFRESH_TOKEN,
  CLUB_NAME: env.CLUB_NAME || "Rivas Club Hockey",
  FMP_CLUB_NAME: env.FMP_CLUB_NAME || "CP RIVAS LAS LAGUNAS",
  RFEP_CLUB_NAME: env.RFEP_CLUB_NAME || "ADISS HOCKEY RIVAS",
  FEDERATION_LOOKAHEAD_DAYS: env.FEDERATION_LOOKAHEAD_DAYS || "14",
  FEDERATION_CACHE_MINUTES: env.FEDERATION_CACHE_MINUTES || "60",
  RESEND_API_KEY: env.RESEND_API_KEY || "",
  EMAIL_FROM: env.EMAIL_FROM || "onboarding@resend.dev",
  EMAIL_PROVIDER: env.EMAIL_PROVIDER || "gmail",
  GMAIL_USER: env.GMAIL_USER || "",
  GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD || "",
  SMTP_TLS_REJECT_UNAUTHORIZED: env.SMTP_TLS_REJECT_UNAUTHORIZED || "false"
};

async function setVar(name, value) {
  console.log(`Setting ${name}...`);
  
  const environments = ["production", "preview", "development"];
  
  // First remove if it exists to overwrite cleanly for all environments
  for (const env of environments) {
    try {
      execSync(`npx vercel env rm ${name} ${env} -y`, { stdio: "ignore" });
    } catch {
      // Ignore if it doesn't exist
    }
  }

  for (const env of environments) {
    await new Promise((resolve) => {
      const child = spawn("npx", ["vercel", "env", "add", name, env], {
        stdio: ["pipe", "inherit", "inherit"],
        shell: true
      });

      child.stdin.write(value);
      child.stdin.end();

      child.on("close", (code) => {
        if (code !== 0) {
          console.error(`Failed to set ${name} on ${env}`);
        }
        resolve();
      });
    });
  }
  console.log(`Successfully set ${name} on all environments`);
}

async function main() {
  for (const [key, val] of Object.entries(varsToSet)) {
    if (!val) {
      console.warn(`Warning: Value for ${key} is empty, skipping.`);
      continue;
    }
    await setVar(key, val);
  }
  console.log("All environment variables set successfully!");
}

main().catch(console.error);
