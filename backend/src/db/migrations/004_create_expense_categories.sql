-- 004_create_expense_categories.sql
-- Expense categories per company (Travel, Meals, Office Supplies, etc.)

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_company_id ON expense_categories(company_id);

DROP TRIGGER IF EXISTS set_updated_at_expense_categories ON expense_categories;
CREATE TRIGGER set_updated_at_expense_categories
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
