-- 002_create_companies.sql
-- Company record, auto-created on first admin signup

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country_id UUID REFERENCES countries(id),
  default_currency_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_country_id ON companies(country_id);

DROP TRIGGER IF EXISTS set_updated_at_companies ON companies;
CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
