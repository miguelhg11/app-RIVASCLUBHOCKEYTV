-- Migration 008: YouTube Channel Videos Cache
-- Table to store all YouTube videos, live streams, and shorts of the channel.

create table if not exists youtube_channel_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  title text not null,
  description text,
  published_at timestamptz not null,
  video_type text not null check (video_type in ('video', 'live', 'short')),
  youtube_watch_url text not null,
  youtube_share_url text,
  youtube_embed_url text,
  playlist_ids jsonb not null default '[]'::jsonb, -- Array of playlist IDs
  detected_at timestamptz not null default now(),
  last_youtube_sync_at timestamptz
);

create index if not exists idx_youtube_channel_videos_published_at on youtube_channel_videos(published_at desc);
create index if not exists idx_youtube_channel_videos_video_type on youtube_channel_videos(video_type);
