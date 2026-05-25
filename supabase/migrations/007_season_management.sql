-- Migration 007: Season Management
-- Crea la tabla de temporadas y asocia equipos, emisiones y asignaciones directas de usuario a temporadas.

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- Ej: "2025-2026", "2026-2027"
  start_year integer not null,
  end_year integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger de updated_at para seasons
drop trigger if exists seasons_updated_at on seasons;
create trigger seasons_updated_at before update on seasons for each row execute function set_updated_at();

-- Añadir columna season_id a las tablas correspondientes (permitiendo temporalmente NULL para asociar datos existentes)
alter table teams add column if not exists season_id uuid references seasons(id) on delete cascade;
alter table broadcasts add column if not exists season_id uuid references seasons(id) on delete cascade;
alter table user_playlists add column if not exists season_id uuid references seasons(id) on delete cascade;

-- Calcular la temporada en curso real e insertar/asociar datos históricos
do $$
declare
  curr_yr integer := extract(year from now());
  curr_mon integer := extract(month from now());
  curr_day integer := extract(day from now());
  season_name text;
  start_yr integer;
  end_yr integer;
  season_uuid uuid;
begin
  -- Regla: Si es antes del 15 de Julio, pertenece al año anterior.
  if curr_mon < 7 or (curr_mon = 7 and curr_day < 15) then
    start_yr := curr_yr - 1;
    end_yr := curr_yr;
  else
    start_yr := curr_yr;
    end_yr := curr_yr + 1;
  end if;

  season_name := start_yr::text || '-' || end_yr::text;

  -- Crear la primera temporada
  insert into seasons (name, start_year, end_year)
  values (season_name, start_yr, end_yr)
  on conflict (name) do nothing;

  select id into season_uuid from seasons where name = season_name;

  -- Asociar datos actuales huérfanos a esta temporada
  update teams set season_id = season_uuid where season_id is null;
  update broadcasts set season_id = season_uuid where season_id is null;
  update user_playlists set season_id = season_uuid where season_id is null;
end $$;

-- Ahora que todos los registros existentes tienen una temporada válida, forzar NOT NULL
alter table teams alter column season_id set not null;
alter table broadcasts alter column season_id set not null;
alter table user_playlists alter column season_id set not null;

-- Ajustar restricciones de unicidad e índices para Teams en base a la temporada
alter table teams drop constraint if exists teams_category_id_name_key;
alter table teams drop constraint if exists teams_season_category_name_key;
alter table teams add constraint teams_season_category_name_key unique (season_id, category_id, name);

drop index if exists idx_teams_category_letter_unique;
drop index if exists idx_teams_category_letter_season_unique;
create unique index idx_teams_category_letter_season_unique
  on teams(season_id, category_id, coalesce(letter, ''));
