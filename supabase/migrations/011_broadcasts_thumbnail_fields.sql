-- Migration: 011_broadcasts_thumbnail_fields.sql
-- Add thumbnail payload and overrides columns to broadcasts table

alter table broadcasts
add column if not exists thumbnail_payload jsonb,
add column if not exists thumbnail_overrides jsonb;
