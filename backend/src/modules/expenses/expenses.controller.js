/**
 * Expenses Controller
 */
const expensesService = require('./expenses.service');
const approvalService = require('../approvals/approvals.service');
const { success, paginated } = require('../../utils/apiResponse');

async function submitExpense(req, res, next) {
  try {
    const data = await expensesService.submitExpense(req.user, req.body, req.file);
    return success(res, data, 'Expense submitted successfully', 201);
  } catch (err) { next(err); }
}

async function listExpenses(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const status = req.query.status || null;

    const { expenses, total } = await expensesService.listExpenses(req.user, { page, limit, status });
    return paginated(res, expenses, total, page, limit, 'Expenses retrieved');
  } catch (err) { next(err); }
}

async function getExpenseById(req, res, next) {
  try {
    const data = await expensesService.getExpenseById(req.params.id, req.user);
    return success(res, data, 'Expense retrieved');
  } catch (err) { next(err); }
}

async function updateExpense(req, res, next) {
  try {
    const data = await expensesService.updateExpense(req.params.id, req.user, req.body);
    return success(res, data, 'Expense updated');
  } catch (err) { next(err); }
}

async function cancelExpense(req, res, next) {
  try {
    await expensesService.cancelExpense(req.params.id, req.user);
    return success(res, null, 'Expense cancelled');
  } catch (err) { next(err); }
}

async function approveExpense(req, res, next) {
  try {
    const result = await approvalService.processAction(
      req.params.id, req.user.id, req.user.company_id, 'approve', req.body?.comments
    );
    return success(res, result, result.message);
  } catch (err) { next(err); }
}

async function rejectExpense(req, res, next) {
  try {
    const result = await approvalService.processAction(
      req.params.id, req.user.id, req.user.company_id, 'reject', req.body?.comments
    );
    return success(res, result, result.message);
  } catch (err) { next(err); }
}

async function overrideExpense(req, res, next) {
  try {
    const result = await approvalService.adminOverride(
      req.params.id, req.user.company_id, req.user.id, req.body.action, req.body.comments
    );
    return success(res, result, result.message);
  } catch (err) { next(err); }
}

module.exports = {
  submitExpense, listExpenses, getExpenseById, updateExpense,
  cancelExpense, approveExpense, rejectExpense, overrideExpense,
};
