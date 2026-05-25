-- YouTube governance expansion
-- Goal: align local model with real YouTube lifecycle and external broadcasts.

-- 1) stream_keys: model liveStreams sync/status and operational metadata.
alter table stream_keys
  add column if not exists youtube_channel_id text,
  add column if not exists youtube_stream_title text,
  add column if not exists backup_rtmp_url text,
  add column if not exists youtube_stream_status text,
  add column if not exists youtube_health_status text,
  add column if not exists youtube_health_issues jsonb not null default '[]'::jsonb,
  add column if not exists is_reusable boolean not null default true,
  add column if not exists sync_origin text not null default 'manual',
  add column if not exists last_youtube_sync_at timestamptz,
  add column if not exists last_youtube_error text,
  add column if not exists youtube_deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stream_keys_sync_origin_check'
  ) then
    alter table stream_keys
      add constraint stream_keys_sync_origin_check
      check (sync_origin in ('manual', 'youtube_sync', 'app_created'));
  end if;
end $$;

create index if not exists idx_stream_keys_last_youtube_sync_at on stream_keys(last_youtube_sync_at);
create index if not exists idx_stream_keys_youtube_stream_status on stream_keys(youtube_stream_status);
create index if not exists idx_stream_keys_youtube_deleted_at on stream_keys(youtube_deleted_at);

-- 2) playlists: add sync metadata from channel playlists.
alter table playlists
  add column if not exists youtube_channel_id text,
  add column if not exists youtube_privacy_status text,
  add column if not exists youtube_item_count integer,
  add column if not exists sync_origin text not null default 'manual',
  add column if not exists last_youtube_sync_at timestamptz,
  add column if not exists last_youtube_error text,
  add column if not exists youtube_deleted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'playlists_sync_origin_check'
  ) then
    alter table playlists
      add constraint playlists_sync_origin_check
      check (sync_origin in ('manual', 'youtube_sync', 'app_created'));
  end if;
end $$;

create index if not exists idx_playlists_last_youtube_sync_at on playlists(last_youtube_sync_at);
create index if not exists idx_playlists_youtube_deleted_at on playlists(youtube_deleted_at);

-- 3) broadcasts: store lifecycle states, share URL and public visibility confirmation.
alter table broadcasts
  add column if not exists youtube_share_url text,
  add column if not exists youtube_life_cycle_status text not null default 'unknown',
  add column if not exists youtube_bound_stream_id text,
  add column if not exists actual_start_time timestamptz,
  add column if not exists actual_end_time timestamptz,
  add column if not exists ended_by uuid references users(id) on delete set null,
  add column if not exists ended_at timestamptz,
  add column if not exists end_reason text,
  add column if not exists visibility_public_confirmed boolean not null default false,
  add column if not exists visibility_public_confirmed_by uuid references users(id) on delete set null,
  add column if not exists visibility_public_confirmed_at timestamptz,
  add column if not exists self_declared_made_for_kids boolean not null default false,
  add column if not exists youtube_raw_status jsonb not null default '{}'::jsonb,
  add column if not exists youtube_raw_content_details jsonb not null default '{}'::jsonb;

update broadcasts
set youtube_share_url = concat('https://youtube.com/live/', youtube_broadcast_id, '?feature=share')
where youtube_share_url is null
  and youtube_broadcast_id is not null;

update broadcasts
set youtube_life_cycle_status = 'unknown'
where youtube_life_cycle_status is null
   or btrim(youtube_life_cycle_status) = '';

alter table broadcasts
  drop constraint if exists broadcasts_privacy_status_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'broadcasts_privacy_status_check_v2'
  ) then
    alter table broadcasts
      add constraint broadcasts_privacy_status_check_v2
      check (privacy_status in ('unlisted', 'public', 'private'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'broadcasts_public_visibility_confirm_check'
  ) then
    alter table broadcasts
      add constraint broadcasts_public_visibility_confirm_check
      check (
        privacy_status <> 'public'
        or (
          visibility_public_confirmed = true
          and visibility_public_confirmed_by is not null
          and visibility_public_confirmed_at is not null
        )
      );
  end if;
end $$;

create index if not exists idx_broadcasts_youtube_life_cycle_status on broadcasts(youtube_life_cycle_status);
create index if not exists idx_broadcasts_stream_key_lifecycle on broadcasts(stream_key_id, youtube_life_cycle_status);
create index if not exists idx_broadcasts_last_youtube_sync_at on broadcasts(last_youtube_sync_at);

-- Occupancy helper index for stream key availability checks.
create index if not exists idx_broadcasts_stream_key_occupied
  on broadcasts(stream_key_id)
  where deleted_at is null
    and youtube_life_cycle_status in ('created', 'ready', 'testing', 'live', 'unknown');

-- 4) youtube sync run tracking.
create table if not exists youtube_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null,
  triggered_by uuid references users(id) on delete set null,
  trigger_source text not null,
  resource_type text not null,
  items_seen integer not null default 0,
  items_upserted integer not null default 0,
  items_failed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'youtube_sync_runs_status_check'
  ) then
    alter table youtube_sync_runs
      add constraint youtube_sync_runs_status_check
      check (status in ('running', 'ok', 'failed', 'partial'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'youtube_sync_runs_trigger_source_check'
  ) then
    alter table youtube_sync_runs
      add constraint youtube_sync_runs_trigger_source_check
      check (trigger_source in ('admin', 'cron', 'broadcast_create', 'manual', 'system'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'youtube_sync_runs_resource_type_check'
  ) then
    alter table youtube_sync_runs
      add constraint youtube_sync_runs_resource_type_check
      check (resource_type in ('all', 'broadcasts', 'streams', 'playlists', 'external_broadcasts'));
  end if;
end $$;

create index if not exists idx_youtube_sync_runs_started_at on youtube_sync_runs(started_at desc);
create index if not exists idx_youtube_sync_runs_status on youtube_sync_runs(status);

-- 5) external broadcasts discovered from YouTube Studio (outside app ownership).
create table if not exists youtube_external_broadcasts (
  id uuid primary key default gen_random_uuid(),
  youtube_broadcast_id text not null unique,
  youtube_video_id text,
  youtube_bound_stream_id text,
  title text not null,
  description text,
  scheduled_start timestamptz,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  privacy_status text,
  youtube_life_cycle_status text not null default 'unknown',
  youtube_watch_url text,
  youtube_share_url text,
  youtube_embed_url text,
  detected_at timestamptz not null default now(),
  last_youtube_sync_at timestamptz,
  matched_broadcast_id uuid references broadcasts(id) on delete set null,
  raw_payload jsonb not null default '{}'::jsonb
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'youtube_external_broadcasts_lifecycle_check'
  ) then
    alter table youtube_external_broadcasts
      add constraint youtube_external_broadcasts_lifecycle_check
      check (youtube_life_cycle_status in ('created', 'ready', 'testing', 'live', 'complete', 'revoked', 'unknown', 'failed', 'cancelled'));
  end if;
end $$;

create index if not exists idx_yext_broadcasts_bound_stream on youtube_external_broadcasts(youtube_bound_stream_id);
create index if not exists idx_yext_broadcasts_lifecycle on youtube_external_broadcasts(youtube_life_cycle_status);
create index if not exists idx_yext_broadcasts_last_sync on youtube_external_broadcasts(last_youtube_sync_at);

-- Occupancy helper index for external broadcasts.
create index if not exists idx_yext_stream_occupied
  on youtube_external_broadcasts(youtube_bound_stream_id)
  where youtube_life_cycle_status in ('created', 'ready', 'testing', 'live', 'unknown');
