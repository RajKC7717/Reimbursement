-- 007_create_approval_rule_steps.sql
-- Individual steps within an approval rule (sequential approvers)

CREATE TABLE IF NOT EXISTS approval_rule_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id),
  approver_role_label VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_rule_steps_rule_id ON approval_rule_steps(rule_id);
CREATE INDEX IF NOT EXISTS idx_approval_rule_steps_approver_id ON approval_rule_steps(approver_id);

DROP TRIGGER IF EXISTS set_updated_at_approval_rule_steps ON approval_rule_steps;
CREATE TRIGGER set_updated_at_approval_rule_steps
  BEFORE UPDATE ON approval_rule_steps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
