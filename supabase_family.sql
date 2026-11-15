-- 👨‍👩‍👧‍👦 FunTopia Family + display names
-- Run this once in the Supabase SQL Editor (same project as the other tables).
-- 1) display_name column on users (shown instead of the username in the
--    lobby, chat and profiles; empty = fall back to the username).
-- 2) families table: one row per family. members is an array of lowercase
--    usernames. code is the 6-character invite code (owner can regenerate it).
-- 3) family_messages table: the family-only chat (newest last, 100 shown).
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;

CREATE TABLE IF NOT EXISTS families (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner text NOT NULL,
  members text[] NOT NULL DEFAULT '{}',
  color text NOT NULL DEFAULT '#7c3aed',
  icon text NOT NULL DEFAULT '🏠',
  motto text NOT NULL DEFAULT '',
  code text NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  family_id text NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  username text NOT NULL,
  text text NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS family_messages_family_idx ON family_messages(family_id, created);
