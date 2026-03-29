-- 006_create_approval_rules.sql
-- Configurable approval rules per company with conditional routing

CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('sequential', 'conditional', 'hybrid')),
  min_amount DECIMAL(15,4),
  max_amount DECIMAL(15,4),
  percentage_threshold INTEGER,
  specific_approver_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_rules_company_id ON approval_rules(company_id);

DROP TRIGGER IF EXISTS set_updated_at_approval_rules ON approval_rules;
CREATE TRIGGER set_updated_at_approval_rules
  BEFORE UPDATE ON approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
