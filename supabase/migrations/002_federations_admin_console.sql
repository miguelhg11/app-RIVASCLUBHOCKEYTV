create table if not exists federation_settings (
  source text primary key check (source in ('fmp', 'rfep')),
  url text not null default '',
  base_url text not null default '',
  default_range_days integer not null default 7 check (default_range_days between 1 and 30),
  club_primary_token text not null default 'RIVAS',
  preferred_aliases jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  last_status text,
  last_error text,
  last_checked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists rfep_leagues (
  league_id integer primary key,
  name text not null,
  category_key text not null,
  url text not null,
  is_active boolean not null default true,
  last_status text,
  last_error text,
  last_checked_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists federation_settings_updated_at on federation_settings;
create trigger federation_settings_updated_at before update on federation_settings for each row execute function set_updated_at();

drop trigger if exists rfep_leagues_updated_at on rfep_leagues;
create trigger rfep_leagues_updated_at before update on rfep_leagues for each row execute function set_updated_at();

insert into federation_settings (source, url, base_url, default_range_days, club_primary_token, preferred_aliases, is_active)
values
  ('fmp', coalesce((select value->>'fmpUrl' from app_settings where key = 'federationsSources'), ''), 'https://sidgad.cloud/shared/portales_files/agenda_portales.php', 7, 'RIVAS', '["CP RIVAS LAS LAGUNAS"]'::jsonb, false),
  ('rfep', coalesce((select value->>'rfepUrl' from app_settings where key = 'federationsSources'), ''), 'https://www.server2.sidgad.es/rfep', 7, 'RIVAS', '["ADISS HOCKEY RIVAS"]'::jsonb, false)
on conflict (source) do nothing;
