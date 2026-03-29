/**
 * Dashboard Service
 */
const { query } = require('../../config/db');

/**
 * Get summary stats for the dashboard, filtered by role.
 */
async function getStats(user) {
  let companyFilter = 'company_id = $1';
  let params = [user.company_id];

  // Employee only sees their own stats
  let userFilter = '';
  if (user.role === 'employee') {
    userFilter = ' AND submitted_by = $2';
    params.push(user.id);
  }

  const statsResult = await query(
    `SELECT
       COUNT(*) as total_expenses,
       COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
       COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
       COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
       COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
       COALESCE(SUM(amount_in_company_currency) FILTER (WHERE status = 'approved'), 0) as total_approved_amount,
       COALESCE(SUM(amount_in_company_currency) FILTER (WHERE status = 'pending'), 0) as total_pending_amount,
       COALESCE(SUM(amount_in_company_currency), 0) as total_amount
     FROM expenses
     WHERE ${companyFilter}${userFilter}`,
    params
  );

  // Get recent expenses
  const recentResult = await query(
    `SELECT e.id, e.title, e.amount, e.currency_code, e.amount_in_company_currency,
            e.status, e.created_at, u.name as submitter_name
     FROM expenses e
     JOIN users u ON e.submitted_by = u.id
     WHERE e.${companyFilter}${userFilter.replace('submitted_by', 'e.submitted_by')}
     ORDER BY e.created_at DESC LIMIT 5`,
    params
  );

  // Get category breakdown
  const categoryResult = await query(
    `SELECT c.name as category, COUNT(*) as count,
            COALESCE(SUM(e.amount_in_company_currency), 0) as total
     FROM expenses e
     LEFT JOIN expense_categories c ON e.category_id = c.id
     WHERE e.${companyFilter}${userFilter.replace('submitted_by', 'e.submitted_by')}
     GROUP BY c.name
     ORDER BY total DESC`,
    params
  );

  return {
    summary: statsResult.rows[0],
    recent_expenses: recentResult.rows,
    category_breakdown: categoryResult.rows,
  };
}

/**
 * Get pending approvals for the logged-in manager/admin
 */
async function getPendingApprovals(user) {
  const result = await query(
    `SELECT ea.id as approval_id, ea.step_number, ea.status as approval_status,
            e.id as expense_id, e.title, e.amount, e.currency_code,
            e.amount_in_company_currency, e.status as expense_status,
            e.created_at, u.name as submitter_name
     FROM expense_approvals ea
     JOIN expenses e ON ea.expense_id = e.id
     JOIN users u ON e.submitted_by = u.id
     WHERE ea.approver_id = $1
       AND ea.status = 'pending'
       AND e.company_id = $2
       AND e.status = 'pending'
       AND e.current_approval_step = ea.step_number
     ORDER BY e.created_at ASC`,
    [user.id, user.company_id]
  );

  return result.rows;
}

module.exports = { getStats, getPendingApprovals };
