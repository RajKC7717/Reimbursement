/**
 * Dashboard Controller
 */
const dashboardService = require('./dashboard.service');
const { success } = require('../../utils/apiResponse');

async function getStats(req, res, next) {
  try {
    const data = await dashboardService.getStats(req.user);
    return success(res, data, 'Dashboard stats retrieved');
  } catch (err) { next(err); }
}

async function getPendingApprovals(req, res, next) {
  try {
    const data = await dashboardService.getPendingApprovals(req.user);
    return success(res, data, 'Pending approvals retrieved');
  } catch (err) { next(err); }
}

module.exports = { getStats, getPendingApprovals };
