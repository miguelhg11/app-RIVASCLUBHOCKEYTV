import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_BASE_URL: z.url(),
  SESSION_SECRET: z.string().min(16),
  SESSION_SECRET_PREVIOUS: z.string().min(16).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  YOUTUBE_MOCK_MODE: z.enum(["true", "false"]).default("true"),
  YOUTUBE_EXPECTED_CHANNEL_ID: z.string().regex(/^UC[a-zA-Z0-9_-]{22}$/).optional(),
  CRON_SECRET: z.string().min(32).optional(),
});

export const serverEnv = serverEnvSchema.parse({
  APP_BASE_URL: process.env.APP_BASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_SECRET_PREVIOUS: process.env.SESSION_SECRET_PREVIOUS,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  YOUTUBE_MOCK_MODE: process.env.YOUTUBE_MOCK_MODE ?? "true",
  YOUTUBE_EXPECTED_CHANNEL_ID: process.env.YOUTUBE_EXPECTED_CHANNEL_ID,
  CRON_SECRET: process.env.CRON_SECRET,
});

if (serverEnv.YOUTUBE_MOCK_MODE === "false" && !serverEnv.YOUTUBE_EXPECTED_CHANNEL_ID) {
  throw new Error("YOUTUBE_EXPECTED_CHANNEL_ID es obligatorio cuando YOUTUBE_MOCK_MODE=false");
}
