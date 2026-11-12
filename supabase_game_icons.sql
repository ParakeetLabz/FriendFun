-- Game icons for FunTopia (Nov 2026).
-- Run this ONCE in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Adds an `icon` column (a single emoji) to the games table.
alter table games add column if not exists icon text;
