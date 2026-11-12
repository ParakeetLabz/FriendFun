-- Suggestion Box for FunTopia (Nov 2026).
-- Run this ONCE in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Table: suggestions (one row per player suggestion; code snippets are
-- reviewed by moderators and NEVER run automatically — approved ones are
-- a to-do list for the team, not executable code).
create table if not exists suggestions (
  id text primary key,
  username text not null,
  title text not null,
  code text not null,
  category text not null default 'feature',
  status text not null default 'pending',
  note text not null default '',
  created bigint not null
);
