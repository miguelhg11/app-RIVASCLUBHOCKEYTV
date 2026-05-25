-- Migration 009: User Password Reset Support
-- Adds reset_token_hash and reset_token_expires_at to the users table.

alter table users
  add column if not exists reset_token_hash text,
  add column if not exists reset_token_expires_at timestamptz;
