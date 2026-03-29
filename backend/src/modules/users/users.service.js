/**
 * Users Service — Business Logic
 * All queries scoped by company_id for tenant isolation.
 */
const bcrypt = require('bcrypt');
const { query } = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

const BCRYPT_ROUNDS = 12;

/**
 * List all users in the company (paginated)
 */
async function listUsers(companyId, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_manager_approver,
              u.manager_id, u.created_at, m.name as manager_name
       FROM users u
       LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.company_id = $1
       ORDER BY u.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    ),
    query('SELECT COUNT(*) as total FROM users WHERE company_id = $1', [companyId]),
  ]);

  return {
    users: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

/**
 * Get a single user by ID (scoped to company)
 */
async function getUserById(userId, companyId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_manager_approver,
            u.manager_id, u.created_at, u.updated_at,
            m.name as manager_name
     FROM users u
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

/**
 * Create a new user (admin action)
 */
async function createUser(companyId, data, actorId) {
  // Check for duplicate email
  const existing = await query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  // Validate manager_id if provided
  if (data.manager_id) {
    const manager = await query(
      'SELECT id, role FROM users WHERE id = $1 AND company_id = $2',
      [data.manager_id, companyId]
    );
    if (manager.rows.length === 0) {
      const err = new Error('Manager not found in this company');
      err.statusCode = 400;
      throw err;
    }
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const result = await query(
    `INSERT INTO users (company_id, name, email, password_hash, role, manager_id, is_manager_approver)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, manager_id, is_manager_approver, is_active, created_at`,
    [companyId, data.name, data.email, passwordHash, data.role, data.manager_id || null, data.is_manager_approver || false]
  );

  const user = result.rows[0];

  await logAudit({
    companyId,
    actorId,
    action: 'USER_CREATED',
    entityType: 'user',
    entityId: user.id,
    metadata: { role: data.role, email: data.email },
  });

  return user;
}

/**
 * Update a user (admin action)
 */
async function updateUser(userId, companyId, data, actorId) {
  // Verify user exists in this company
  const existing = await query(
    'SELECT id, role FROM users WHERE id = $1 AND company_id = $2',
    [userId, companyId]
  );
  if (existing.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Validate manager_id if provided
  if (data.manager_id) {
    if (data.manager_id === userId) {
      const err = new Error('A user cannot be their own manager');
      err.statusCode = 400;
      throw err;
    }
    const manager = await query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2',
      [data.manager_id, companyId]
    );
    if (manager.rows.length === 0) {
      const err = new Error('Manager not found in this company');
      err.statusCode = 400;
      throw err;
    }
  }

  // Build dynamic update query
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
  if (data.role !== undefined) { fields.push(`role = $${paramIndex++}`); values.push(data.role); }
  if (data.manager_id !== undefined) { fields.push(`manager_id = $${paramIndex++}`); values.push(data.manager_id); }
  if (data.is_manager_approver !== undefined) { fields.push(`is_manager_approver = $${paramIndex++}`); values.push(data.is_manager_approver); }
  if (data.is_active !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(data.is_active); }

  if (fields.length === 0) {
    const err = new Error('No fields to update');
    err.statusCode = 400;
    throw err;
  }

  values.push(userId, companyId);
  const result = await query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND company_id = $${paramIndex}
     RETURNING id, name, email, role, manager_id, is_manager_approver, is_active, updated_at`,
    values
  );

  await logAudit({
    companyId,
    actorId,
    action: 'USER_UPDATED',
    entityType: 'user',
    entityId: userId,
    metadata: data,
  });

  return result.rows[0];
}

/**
 * Soft delete a user (set is_active = false)
 */
async function deleteUser(userId, companyId, actorId) {
  // Prevent self-deletion
  if (userId === actorId) {
    const err = new Error('You cannot deactivate your own account');
    err.statusCode = 400;
    throw err;
  }

  const result = await query(
    `UPDATE users SET is_active = false
     WHERE id = $1 AND company_id = $2
     RETURNING id, name, email`,
    [userId, companyId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  await logAudit({
    companyId,
    actorId,
    action: 'USER_DEACTIVATED',
    entityType: 'user',
    entityId: userId,
  });

  return result.rows[0];
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
