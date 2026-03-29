/**
 * Audit Logger Utility
 * Writes immutable audit trail entries for every state change.
 */
const { query } = require('../config/db');
const logger = require('../config/logger');

/**
 * Log an audit event
 * @param {object} params
 * @param {string} params.companyId - Company UUID
 * @param {string} params.actorId - User UUID who performed the action
 * @param {string} params.action - Action name (e.g. "EXPENSE_SUBMITTED")
 * @param {string} params.entityType - Entity type (e.g. "expense", "user")
 * @param {string} params.entityId - Entity UUID
 * @param {object} [params.metadata] - Additional context (optional)
 */
async function logAudit({ companyId, actorId, action, entityType, entityId, metadata = null }) {
  try {
    await query(
      `INSERT INTO audit_logs (company_id, actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [companyId, actorId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    // Audit logging failure should not break the main operation
    // but we must log it for investigation
    logger.error('Failed to write audit log', {
      error: err.message,
      action,
      entityType,
      entityId,
    });
  }
}

module.exports = { logAudit };
