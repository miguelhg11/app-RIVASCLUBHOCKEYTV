-- Migration 006: team_playlists
-- Relación muchos a muchos para asignar listas de reproducción (playlists) a equipos.

create table if not exists team_playlists (
  team_id uuid not null references teams(id) on delete cascade,
  playlist_id uuid not null references playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, playlist_id)
);

create index if not exists idx_team_playlists_team_id on team_playlists(team_id);
create index if not exists idx_team_playlists_playlist_id on team_playlists(playlist_id);
