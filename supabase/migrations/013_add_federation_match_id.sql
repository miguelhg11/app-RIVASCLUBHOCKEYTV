-- Migration: 013_add_federation_match_id.sql
-- Add federation_match_id column to broadcasts table

alter table broadcasts
  add column if not exists federation_match_id text;
