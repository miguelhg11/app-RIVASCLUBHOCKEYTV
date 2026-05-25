-- Rivas YouTube Live Manager — esquema inicial
-- Revisar antes de aplicar en producción.

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'user');
create type federation_source as enum ('manual', 'fmp', 'rfep');
create type sync_status as enum ('pending', 'synced', 'failed', 'cancelled');
create type thumbnail_status as enum ('pending', 'uploaded', 'failed', 'skipped');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  role user_role not null default 'user',
  name text not null,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  display_name text,
  federation_scope text not null default 'fmp' check (federation_scope in ('fmp', 'rfep', 'manual')),
  federation_team_name text,
  requires_minor_consent_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, name)
);

create table if not exists stream_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  youtube_live_stream_id text not null unique,
  stream_key text not null,
  rtmp_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  youtube_playlist_id text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists thumbnail_backgrounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url_path text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_teams (
  user_id uuid not null references users(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

create table if not exists user_stream_keys (
  user_id uuid not null references users(id) on delete cascade,
  stream_key_id uuid not null references stream_keys(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, stream_key_id)
);

create table if not exists user_playlists (
  user_id uuid not null references users(id) on delete cascade,
  playlist_id uuid not null references playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, playlist_id)
);

create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references users(id) on delete restrict,
  team_id uuid not null references teams(id) on delete restrict,
  stream_key_id uuid not null references stream_keys(id) on delete restrict,
  playlist_id uuid references playlists(id) on delete set null,
  thumbnail_background_id uuid references thumbnail_backgrounds(id) on delete set null,

  title text not null,
  description text,
  scheduled_start timestamptz not null,
  privacy_status text not null default 'unlisted',

  youtube_broadcast_id text unique,
  youtube_video_id text,
  youtube_watch_url text,
  youtube_embed_url text,
  youtube_playlist_id text,

  competition_name text,
  venue text,
  home_team_name text not null,
  away_team_name text not null,
  home_crest_url text,
  away_crest_url text,
  federation_source federation_source not null default 'manual',
  federation_raw_url text,
  federation_confidence numeric(4,3),

  thumbnail_url text,
  thumbnail_status thumbnail_status not null default 'pending',
  youtube_sync_status sync_status not null default 'pending',
  last_youtube_sync_at timestamptz,
  youtube_last_error text,

  confirmed_legal_basis boolean not null default false,
  confirmed_by uuid references users(id) on delete set null,
  confirmed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  check (privacy_status = 'unlisted'),
  check ((confirmed_legal_basis = true and confirmed_by is not null and confirmed_at is not null) or confirmed_legal_basis = false)
);

create table if not exists operation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  broadcast_id uuid references broadcasts(id) on delete set null,
  operation_type text not null,
  status text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated_at on users;
create trigger users_updated_at before update on users for each row execute function set_updated_at();

drop trigger if exists categories_updated_at on categories;
create trigger categories_updated_at before update on categories for each row execute function set_updated_at();

drop trigger if exists teams_updated_at on teams;
create trigger teams_updated_at before update on teams for each row execute function set_updated_at();

drop trigger if exists stream_keys_updated_at on stream_keys;
create trigger stream_keys_updated_at before update on stream_keys for each row execute function set_updated_at();

drop trigger if exists playlists_updated_at on playlists;
create trigger playlists_updated_at before update on playlists for each row execute function set_updated_at();

drop trigger if exists thumbnail_backgrounds_updated_at on thumbnail_backgrounds;
create trigger thumbnail_backgrounds_updated_at before update on thumbnail_backgrounds for each row execute function set_updated_at();

drop trigger if exists broadcasts_updated_at on broadcasts;
create trigger broadcasts_updated_at before update on broadcasts for each row execute function set_updated_at();

create index if not exists idx_broadcasts_created_by on broadcasts(created_by);
create index if not exists idx_broadcasts_team_id on broadcasts(team_id);
create index if not exists idx_broadcasts_scheduled_start on broadcasts(scheduled_start);
create index if not exists idx_broadcasts_youtube_sync_status on broadcasts(youtube_sync_status);
create index if not exists idx_operation_logs_user_id on operation_logs(user_id);
create index if not exists idx_operation_logs_broadcast_id on operation_logs(broadcast_id);
create index if not exists idx_operation_logs_created_at on operation_logs(created_at);

insert into app_settings (key, value)
values
  ('club', '{"name":"Rivas Club Hockey","fmpClubName":"CP RIVAS LAS LAGUNAS","rfepClubName":"ADISS HOCKEY RIVAS"}'::jsonb),
  ('youtubeDefaults', '{"privacyStatus":"unlisted","latencyPreference":"normal","enableAutoStart":true,"enableAutoStop":false}'::jsonb),
  ('federations', '{"lookaheadDays":14,"cacheMinutes":60}'::jsonb)
on conflict (key) do nothing;
