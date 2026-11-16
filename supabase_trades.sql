-- 🔄 Trading — run once in the Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS trades (
  id text PRIMARY KEY,
  from_user text NOT NULL,
  to_user text NOT NULL,
  offer text[] NOT NULL DEFAULT '{}',
  want text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS trades_to_user_idx ON trades (to_user, created DESC);
CREATE INDEX IF NOT EXISTS trades_from_user_idx ON trades (from_user, created DESC);
