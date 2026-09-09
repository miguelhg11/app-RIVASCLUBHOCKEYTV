revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

do $$
declare table_name text;
begin
  for table_name in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create table if not exists public.youtube_sync_leases (
  lease_name text primary key,
  owner_id uuid not null,
  expires_at timestamptz not null
);

alter table public.youtube_sync_leases enable row level security;
revoke all on public.youtube_sync_leases from public, anon, authenticated;
grant all on public.youtube_sync_leases to service_role;

create or replace function public.acquire_youtube_sync_lease(p_owner_id uuid, p_ttl_seconds integer default 120)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.youtube_sync_leases(lease_name, owner_id, expires_at)
  values ('channel', p_owner_id, now() + make_interval(secs => p_ttl_seconds))
  on conflict (lease_name) do update
    set owner_id = excluded.owner_id, expires_at = excluded.expires_at
    where youtube_sync_leases.expires_at < now();
  return exists (select 1 from public.youtube_sync_leases where lease_name = 'channel' and owner_id = p_owner_id);
end;
$$;

create or replace function public.release_youtube_sync_lease(p_owner_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.youtube_sync_leases where lease_name = 'channel' and owner_id = p_owner_id;
$$;

revoke all on function public.acquire_youtube_sync_lease(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_youtube_sync_lease(uuid) from public, anon, authenticated;
grant execute on function public.acquire_youtube_sync_lease(uuid, integer) to service_role;
grant execute on function public.release_youtube_sync_lease(uuid) to service_role;
