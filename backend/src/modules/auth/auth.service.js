/**
 * Auth Service — Business Logic
 * Handles signup (auto-company creation), login, token refresh, and logout.
 */
const bcrypt = require('bcrypt');
const { query } = require('../../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { logAudit } = require('../../utils/auditLogger');
const logger = require('../../config/logger');

const BCRYPT_ROUNDS = 12;

/**
 * Signup — first user becomes admin and auto-creates company.
 * Subsequent signups create employees linked to the existing company.
 */
async function signup({ name, email, password, company_name, country_id }) {
  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  // Get the country to determine default currency
  const countryResult = await query('SELECT id, currency_code FROM countries WHERE id = $1', [country_id]);
  if (countryResult.rows.length === 0) {
    const err = new Error('Invalid country ID');
    err.statusCode = 400;
    throw err;
  }
  const country = countryResult.rows[0];

  // Check if any company exists (single-tenant: first user = admin)
  const companyResult = await query('SELECT id FROM companies LIMIT 1');
  let companyId;
  let role = 'employee';

  if (companyResult.rows.length === 0) {
    // First user — create company and make them admin
    const newCompany = await query(
      `INSERT INTO companies (name, country_id, default_currency_code)
       VALUES ($1, $2, $3) RETURNING id`,
      [company_name, country_id, country.currency_code]
    );
    companyId = newCompany.rows[0].id;
    role = 'admin';
    logger.info(`Company created: ${company_name} (${companyId})`);
  } else {
    // Subsequent users join existing company
    companyId = companyResult.rows[0].id;
    role = 'employee';
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const userResult = await query(
    `INSERT INTO users (company_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, company_id, name, email, role, created_at`,
    [companyId, name, email, passwordHash, role]
  );
  const user = userResult.rows[0];

  // Generate tokens
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  });
  const refreshToken = signRefreshToken({ id: user.id });

  // Store refresh token in DB
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  // Audit log
  await logAudit({
    companyId: user.company_id,
    actorId: user.id,
    action: 'USER_SIGNUP',
    entityType: 'user',
    entityId: user.id,
    metadata: { role, email },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Login — verify credentials, return tokens
 */
async function login({ email, password }) {
  // Find user by email
  const result = await query(
    `SELECT u.id, u.company_id, u.name, u.email, u.password_hash, u.role, u.is_active,
            c.name as company_name
     FROM users u
     JOIN companies c ON u.company_id = c.id
     WHERE u.email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Generate tokens
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  });
  const refreshToken = signRefreshToken({ id: user.id });

  // Store refresh token
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      company_name: user.company_name,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Refresh — issue new access token using a valid refresh token
 */
async function refresh({ refresh_token }) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refresh_token);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    throw error;
  }

  // Verify refresh token matches what's stored in DB
  const result = await query(
    'SELECT id, email, role, company_id, is_active, refresh_token FROM users WHERE id = $1',
    [decoded.id]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  if (user.refresh_token !== refresh_token) {
    const err = new Error('Refresh token has been invalidated');
    err.statusCode = 401;
    throw err;
  }

  // Issue new access token
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  });

  // Rotate refresh token
  const newRefreshToken = signRefreshToken({ id: user.id });
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

  return {
    access_token: accessToken,
    refresh_token: newRefreshToken,
  };
}

/**
 * Logout — invalidate refresh token
 */
async function logout(userId) {
  await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);
}

/**
 * Get current user profile
 */
async function getProfile(userId, companyId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.company_id, u.is_manager_approver,
            u.manager_id, u.is_active, u.created_at,
            c.name as company_name, c.default_currency_code,
            m.name as manager_name
     FROM users u
     JOIN companies c ON u.company_id = c.id
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.id = $1 AND u.company_id = $2`,
    [userId, companyId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getProfile,
};
