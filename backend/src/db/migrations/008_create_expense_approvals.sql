-- 008_create_expense_approvals.sql
-- Tracks each approver's decision on each expense (one row per approver per expense)

CREATE TABLE IF NOT EXISTS expense_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  step_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense_id ON expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver_id ON expense_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_status ON expense_approvals(status);

DROP TRIGGER IF EXISTS set_updated_at_expense_approvals ON expense_approvals;
CREATE TRIGGER set_updated_at_expense_approvals
  BEFORE UPDATE ON expense_approvals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
