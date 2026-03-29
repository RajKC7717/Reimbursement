-- 003_create_users.sql
-- Users with role-based access, manager hierarchy, and refresh token storage

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  manager_id UUID REFERENCES users(id),
  is_manager_approver BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

DROP TRIGGER IF EXISTS set_updated_at_users ON users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
