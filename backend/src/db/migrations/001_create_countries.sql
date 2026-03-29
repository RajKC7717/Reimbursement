-- 001_create_countries.sql
-- Stores country and currency data, seeded from REST Countries API

CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  currency_name VARCHAR(100) NOT NULL,
  currency_symbol VARCHAR(10) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_countries_currency_code ON countries(currency_code);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_updated_at_countries ON countries;
CREATE TRIGGER set_updated_at_countries
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
