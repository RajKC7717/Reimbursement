/**
 * Approval Rules Controller
 */
const rulesService = require('./rules.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try {
    const data = await rulesService.listRules(req.user.company_id);
    return success(res, data, 'Approval rules retrieved');
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const data = await rulesService.getRuleById(req.params.id, req.user.company_id);
    return success(res, data, 'Approval rule retrieved');
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await rulesService.createRule(req.user.company_id, req.body, req.user.id);
    return success(res, data, 'Approval rule created', 201);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await rulesService.updateRule(req.params.id, req.user.company_id, req.body, req.user.id);
    return success(res, data, 'Approval rule updated');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await rulesService.deleteRule(req.params.id, req.user.company_id, req.user.id);
    return success(res, null, 'Approval rule deleted');
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };
