-- 005_create_expenses.sql
-- Core expenses table with multi-currency support and approval tracking

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  submitted_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,4) NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  amount_in_company_currency DECIMAL(15,4),
  exchange_rate DECIMAL(15,6),
  category_id UUID REFERENCES expense_categories(id),
  expense_date DATE NOT NULL,
  receipt_url VARCHAR(500),
  ocr_raw_data JSONB,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
  current_approval_step INTEGER DEFAULT 1,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses(submitted_by);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);

DROP TRIGGER IF EXISTS set_updated_at_expenses ON expenses;
CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
