/**
 * Expenses Service
 * Handles expense submission with currency conversion,
 * listing (role-filtered), detail view, and status updates.
 */
const { query } = require('../../config/db');
const { convertCurrency } = require('../../utils/currency');
const { logAudit } = require('../../utils/auditLogger');
const approvalService = require('../approvals/approvals.service');
const logger = require('../../config/logger');

/**
 * Submit a new expense.
 * 1. Convert amount to company currency
 * 2. Insert expense record
 * 3. Initialize approval workflow
 */
async function submitExpense(user, data, receiptFile = null) {
  // Get company default currency
  const companyResult = await query(
    'SELECT default_currency_code FROM companies WHERE id = $1',
    [user.company_id]
  );
  const companyCurrency = companyResult.rows[0].default_currency_code;

  // Convert to company currency
  const { convertedAmount, exchangeRate } = await convertCurrency(
    data.amount,
    data.currency_code,
    companyCurrency
  );

  // Build receipt URL if file uploaded
  const receiptUrl = receiptFile ? `/uploads/${receiptFile.filename}` : null;

  // Insert expense
  const result = await query(
    `INSERT INTO expenses (
       company_id, submitted_by, title, description, amount, currency_code,
       amount_in_company_currency, exchange_rate, category_id, expense_date,
       receipt_url, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
     RETURNING *`,
    [
      user.company_id, user.id, data.title, data.description || null,
      data.amount, data.currency_code, convertedAmount, exchangeRate,
      data.category_id, data.expense_date, receiptUrl,
    ]
  );
  const expense = result.rows[0];

  // Initialize approval workflow (this sets status to 'pending')
  const workflowResult = await approvalService.initializeWorkflow(
    expense.id, user.company_id, user.id
  );

  // Re-fetch expense with updated status
  const updatedExpense = await query('SELECT * FROM expenses WHERE id = $1', [expense.id]);

  await logAudit({
    companyId: user.company_id,
    actorId: user.id,
    action: 'EXPENSE_SUBMITTED',
    entityType: 'expense',
    entityId: expense.id,
    metadata: {
      amount: data.amount,
      currency_code: data.currency_code,
      converted_amount: convertedAmount,
      auto_approved: workflowResult.autoApproved,
    },
  });

  return updatedExpense.rows[0];
}

/**
 * List expenses — filtered by role:
 * - Employee: only their own expenses
 * - Manager: their own + their direct reports' expenses
 * - Admin: all company expenses
 */
async function listExpenses(user, { page = 1, limit = 20, status = null }) {
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE e.company_id = $1';
  const params = [user.company_id];
  let paramIndex = 2;

  if (user.role === 'employee') {
    whereClause += ` AND e.submitted_by = $${paramIndex++}`;
    params.push(user.id);
  } else if (user.role === 'manager') {
    // Manager sees their own expenses + those submitted by their direct reports
    whereClause += ` AND (e.submitted_by = $${paramIndex++} OR e.submitted_by IN (
      SELECT id FROM users WHERE manager_id = $${paramIndex++} AND company_id = $${paramIndex++}
    ))`;
    params.push(user.id, user.id, user.company_id);
  }
  // Admin sees all company expenses (no additional filter)

  if (status) {
    whereClause += ` AND e.status = $${paramIndex++}`;
    params.push(status);
  }

  params.push(limit, offset);

  const dataResult = await query(
    `SELECT e.*, u.name as submitter_name, u.email as submitter_email,
            c.name as category_name
     FROM expenses e
     JOIN users u ON e.submitted_by = u.id
     LEFT JOIN expense_categories c ON e.category_id = c.id
     ${whereClause}
     ORDER BY e.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  // Count query with same filters
  const countParams = params.slice(0, -2); // remove limit and offset
  const countResult = await query(
    `SELECT COUNT(*) as total FROM expenses e ${whereClause}`,
    countParams
  );

  return {
    expenses: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

/**
 * Get expense detail with full approval trail
 */
async function getExpenseById(expenseId, user) {
  // Build access query based on role
  let accessFilter = 'AND e.company_id = $2';
  const params = [expenseId, user.company_id];

  if (user.role === 'employee') {
    accessFilter += ' AND e.submitted_by = $3';
    params.push(user.id);
  }
  // Manager and Admin can see any expense in their company
  // (Manager sees it if they're an approver on it — handled by the approval check)

  const expenseResult = await query(
    `SELECT e.*, u.name as submitter_name, u.email as submitter_email,
            c.name as category_name, co.name as currency_name
     FROM expenses e
     JOIN users u ON e.submitted_by = u.id
     LEFT JOIN expense_categories c ON e.category_id = c.id
     LEFT JOIN countries co ON e.currency_code = co.currency_code
     WHERE e.id = $1 ${accessFilter}`,
    params
  );

  if (expenseResult.rows.length === 0) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }

  // Get approval trail
  const approvalsResult = await query(
    `SELECT ea.*, u.name as approver_name, u.email as approver_email
     FROM expense_approvals ea
     JOIN users u ON ea.approver_id = u.id
     WHERE ea.expense_id = $1
     ORDER BY ea.step_number ASC`,
    [expenseId]
  );

  return {
    ...expenseResult.rows[0],
    approvals: approvalsResult.rows,
  };
}

/**
 * Update a draft expense (only by the submitter, only while draft)
 */
async function updateExpense(expenseId, user, data) {
  const existing = await query(
    `SELECT * FROM expenses WHERE id = $1 AND company_id = $2 AND submitted_by = $3`,
    [expenseId, user.company_id, user.id]
  );

  if (existing.rows.length === 0) {
    const err = new Error('Expense not found');
    err.statusCode = 404;
    throw err;
  }

  if (existing.rows[0].status !== 'draft') {
    const err = new Error('Can only update draft expenses');
    err.statusCode = 400;
    throw err;
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(data.amount); }
  if (data.currency_code !== undefined) { fields.push(`currency_code = $${idx++}`); values.push(data.currency_code); }
  if (data.category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(data.category_id); }
  if (data.expense_date !== undefined) { fields.push(`expense_date = $${idx++}`); values.push(data.expense_date); }

  values.push(expenseId);
  const result = await query(
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0];
}

/**
 * Cancel a draft expense
 */
async function cancelExpense(expenseId, user) {
  const result = await query(
    `UPDATE expenses SET status = 'cancelled'
     WHERE id = $1 AND company_id = $2 AND submitted_by = $3 AND status = 'draft'
     RETURNING *`,
    [expenseId, user.company_id, user.id]
  );

  if (result.rows.length === 0) {
    const err = new Error('Expense not found or cannot be cancelled');
    err.statusCode = 404;
    throw err;
  }

  await logAudit({
    companyId: user.company_id,
    actorId: user.id,
    action: 'EXPENSE_CANCELLED',
    entityType: 'expense',
    entityId: expenseId,
  });

  return result.rows[0];
}

module.exports = {
  submitExpense,
  listExpenses,
  getExpenseById,
  updateExpense,
  cancelExpense,
};
