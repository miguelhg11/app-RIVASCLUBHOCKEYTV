-- Migration: Add is_default and base64_data columns to thumbnail_backgrounds table
-- Allow one background to be default, others not.

alter table thumbnail_backgrounds
add column if not exists is_default boolean not null default false,
add column if not exists base64_data text;

-- Asegurar que si hay una por defecto, las demás no lo sean (usando trigger o constraints).
-- Como SQLite o Supabase Postgres pueden usar triggers, usaremos una lógica simple de aplicación:
-- Se controlará principalmente desde la lógica de la app/actions, pero añadimos índice parcial de unicidad para evitar múltiples defaults.
create unique index if not exists idx_thumbnail_backgrounds_default_only_one
on thumbnail_backgrounds (is_default)
where (is_default = true);
