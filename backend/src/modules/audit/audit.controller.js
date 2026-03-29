/**
 * Audit Logs Controller
 */
const auditService = require('./audit.service');
const { paginated } = require('../../utils/apiResponse');

async function listLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const entity_type = req.query.entity_type || null;
    const action = req.query.action || null;

    const { logs, total } = await auditService.listAuditLogs(
      req.user.company_id, { page, limit, entity_type, action }
    );
    return paginated(res, logs, total, page, limit, 'Audit logs retrieved');
  } catch (err) { next(err); }
}

module.exports = { listLogs };
