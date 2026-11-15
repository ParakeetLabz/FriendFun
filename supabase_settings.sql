-- 🏷️ Site version (the "Beta <version>" tag next to the FunTopia logo)
-- Run this once in the Supabase SQL Editor (same project as the other tables).
-- Stores the version the owner sets in the Owner Panel.
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated timestamptz NOT NULL DEFAULT now()
);
-- Start at 1.0 (the owner can change it in the Owner Panel).
INSERT INTO settings (key, value) VALUES ('version', '1.0') ON CONFLICT (key) DO NOTHING;
