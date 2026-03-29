/**
 * Audit Logs Service
 */
const { query } = require('../../config/db');

async function listAuditLogs(companyId, { page = 1, limit = 20, entity_type = null, action = null }) {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE al.company_id = $1';
  const params = [companyId];
  let idx = 2;

  if (entity_type) {
    whereClause += ` AND al.entity_type = $${idx++}`;
    params.push(entity_type);
  }
  if (action) {
    whereClause += ` AND al.action = $${idx++}`;
    params.push(action);
  }

  params.push(limit, offset);

  const dataResult = await query(
    `SELECT al.*, u.name as actor_name, u.email as actor_email
     FROM audit_logs al
     JOIN users u ON al.actor_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  const countParams = params.slice(0, -2);
  const countResult = await query(
    `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`,
    countParams
  );

  return {
    logs: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

module.exports = { listAuditLogs };
