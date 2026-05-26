import { z } from "zod";

export const createBroadcastSchema = z.object({
  teamId: z.uuid(),
  streamKeyId: z.uuid(),
  playlistId: z.uuid(),
  competitionName: z.string().trim().min(2).max(140),
  homeTeamName: z.string().trim().min(2).max(140),
  awayTeamName: z.string().trim().min(2).max(140),
  homeCrestUrl: z.string().trim().optional(),
  awayCrestUrl: z.string().trim().optional(),
  venue: z.string().trim().max(200).optional(),
  scheduledStart: z.string().min(16),
  description: z.string().trim().max(4000).optional(),
  confirmedLegalBasis: z.literal(true),
  federationSource: z.enum(["manual", "fmp", "rfep"]).optional().default("manual"),
  federationMatchId: z.string().trim().max(100).optional(),
  federationTeamKey: z.string().trim().max(50).optional(),
  thumbnailPayload: z.string().trim().optional(),
  thumbnailOverrides: z.string().trim().optional(),
  thumbnailBackgroundId: z.string().uuid().optional(),
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;

export const updateBroadcastSchema = z.object({
  id: z.uuid(),
  teamId: z.uuid(),
  streamKeyId: z.uuid(),
  playlistId: z.uuid(),
  competitionName: z.string().trim().min(2).max(140),
  homeTeamName: z.string().trim().min(2).max(140),
  awayTeamName: z.string().trim().min(2).max(140),
  homeCrestUrl: z.string().trim().optional(),
  awayCrestUrl: z.string().trim().optional(),
  venue: z.string().trim().max(200).optional(),
  scheduledStart: z.string().min(16),
  description: z.string().trim().max(4000).optional(),
  federationSource: z.enum(["manual", "fmp", "rfep"]).optional().default("manual"),
  federationMatchId: z.string().trim().max(100).optional(),
  federationTeamKey: z.string().trim().max(50).optional(),
  thumbnailPayload: z.string().trim().optional(),
  thumbnailOverrides: z.string().trim().optional(),
  thumbnailBackgroundId: z.string().uuid().optional().nullable(),
});

export type UpdateBroadcastInput = z.infer<typeof updateBroadcastSchema>;

