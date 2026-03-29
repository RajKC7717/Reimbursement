-- 000_setup.sql
-- Enable UUID generation and create shared utilities

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
