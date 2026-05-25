import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  APP_BASE_URL: z.url(),
  SESSION_SECRET: z.string().min(16),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  YOUTUBE_MOCK_MODE: z.enum(["true", "false"]).default("true"),
});

export const serverEnv = serverEnvSchema.parse({
  APP_BASE_URL: process.env.APP_BASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  YOUTUBE_MOCK_MODE: process.env.YOUTUBE_MOCK_MODE ?? "true",
});
