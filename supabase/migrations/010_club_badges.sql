-- Migration: 010_club_badges.sql
-- Create club_badges table and set up policies

create table if not exists club_badges (
  id uuid primary key default gen_random_uuid(),
  source_scope text not null check (source_scope in ('fmp', 'rfep', 'seleccion_autonomica', 'manual')),
  canonical_name text not null unique,
  short_code text,
  aliases text[] not null default '{}'::text[],
  normalized_aliases text[] not null default '{}'::text[],
  logo_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable updated_at trigger
drop trigger if exists club_badges_updated_at on club_badges;
create trigger club_badges_updated_at before update on club_badges for each row execute function set_updated_at();

-- Index for fast searches
create index if not exists idx_club_badges_normalized_aliases on club_badges using gin (normalized_aliases);
