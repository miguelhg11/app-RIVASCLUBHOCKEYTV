-- Migration 016: Add public visibility permissions to users and privacy status to cached videos
-- Alter table users to add permission to schedule/emit public broadcasts
alter table users
  add column if not exists can_publish_public boolean not null default false;

-- Alter table youtube_channel_videos to store video visibility status
alter table youtube_channel_videos
  add column if not exists privacy_status text not null default 'unlisted';
