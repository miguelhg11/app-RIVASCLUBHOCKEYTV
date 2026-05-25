import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export const teamSchema = z.object({
  categoryId: z.uuid(),
  name: z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().min(2).max(120).optional()),
  letter: z.enum(["A", "B", "C", "D", "none"]).default("none"),
  displayName: z.string().trim().max(120).optional(),
  federationScope: z.enum(["fmp", "rfep", "manual"]).optional().default("manual"),
  federationTeamName: z.string().trim().max(120).optional(),
});

export const adminUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(["admin", "user"]),
});

export const streamKeySchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const playlistSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional(),
});

export const thumbnailBackgroundSchema = z.object({
  name: z.string().trim().min(2).max(120),
  urlPath: z.string().trim().min(1).max(400),
});
