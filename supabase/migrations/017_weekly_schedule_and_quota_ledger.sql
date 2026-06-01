-- Migration 017: Create weekly_schedules and youtube_quota_usage_events
-- This allows caching the match schedule for the weekend, avoiding real-time YouTube API reads,
-- and tracks YouTube API quota consumption to offer real-time graphs inside the Admin Panel.

-- 1. Create table for caching weekly schedules
create table if not exists weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  data jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  created_by uuid references users(id) on delete set null
);

-- Index to quickly query schedule updates for dates
create index if not exists idx_weekly_schedules_dates on weekly_schedules(start_date, end_date);

-- Enable RLS for weekly_schedules
alter table weekly_schedules enable row level security;

-- Policies for weekly_schedules
create policy "Allow public read access to weekly_schedules" 
  on weekly_schedules for select 
  using (true);

create policy "Allow all actions to administrators on weekly_schedules" 
  on weekly_schedules for all 
  using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
        and users.role = 'admin'
    )
  );

-- 2. Create table for tracking YouTube API quota ledger events
create table if not exists youtube_quota_usage_events (
  id uuid primary key default gen_random_uuid(),
  method text not null,               -- e.g., 'liveBroadcasts.insert', 'thumbnails.set'
  quota_cost integer not null,        -- cost in units, e.g., 100, 50
  feature text not null,              -- e.g., 'create_broadcast', 'sync_channel'
  youtube_resource_id text,          -- e.g., video ID or stream key ID if applicable
  user_id uuid references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Index for quick aggregation of costs
create index if not exists idx_quota_usage_date on youtube_quota_usage_events(created_at);

-- Enable RLS for quota usage ledger
alter table youtube_quota_usage_events enable row level security;

-- Policies for quota ledger
create policy "Allow read access to admins on youtube_quota_usage_events"
  on youtube_quota_usage_events for select
  using (
    exists (
      select 1 from users 
      where users.id = auth.uid() 
        and users.role = 'admin'
    )
  );

create policy "Allow inserts to authenticated users on youtube_quota_usage_events"
  on youtube_quota_usage_events for insert
  with check (auth.uid() is not null);
