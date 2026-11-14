-- Verified accounts for FunTopia (Nov 2026).
-- Run this ONCE in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Table: verified (one row per verified player; 'fun' + 'funtopia' are
-- always verified as built-in defaults and never need a row here).
create table if not exists verified (
  username text primary key
);
