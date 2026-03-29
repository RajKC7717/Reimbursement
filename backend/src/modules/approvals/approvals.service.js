/**
 * Approval Engine Service
 * THE HEART OF THE SYSTEM — handles all approval workflow logic.
 *
 * Supports three rule types:
 * 1. SEQUENTIAL: Each step must approve in order. Any rejection rejects the expense.
 * 2. CONDITIONAL: A percentage threshold of approvers must approve (any order).
 * 3. HYBRID: If a specific approver (e.g. CFO) approves → auto-approve.
 *            Otherwise, check percentage threshold.
 */
const { query, getClient } = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');
const logger = require('../../config/logger');

/**
 * Find the matching approval rule for an expense based on amount range.
 * Returns the best matching active rule for this company, or null if none.
 */
async function findMatchingRule(companyId, amount) {
  // Find rule where amount falls within [min_amount, max_amount] range
  // Rules with NULL min/max are treated as unbounded
  const result = await query(
    `SELECT * FROM approval_rules
     WHERE company_id = $1
       AND is_active = true
       AND (min_amount IS NULL OR min_amount <= $2)
       AND (max_amount IS NULL OR max_amount >= $2)
     ORDER BY min_amount DESC NULLS LAST
     LIMIT 1`,
    [companyId, amount]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Initialize the approval workflow for a newly submitted expense.
 *
 * Steps:
 * 1. Find matching approval rule by amount range
 * 2. If employee.is_manager_approver = true, prepend manager as Step 1
 * 3. Create expense_approval rows for each step
 * 4. Set expense status to 'pending' and current_approval_step to 1
 */
async function initializeWorkflow(expenseId, companyId, submitterId) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get the expense details
    const expenseResult = await client.query(
      'SELECT * FROM expenses WHERE id = $1 AND company_id = $2',
      [expenseId, companyId]
    );
    if (expenseResult.rows.length === 0) {
      throw new Error('Expense not found');
    }
    const expense = expenseResult.rows[0];

    // Get submitter details to check is_manager_approver
    const userResult = await client.query(
      'SELECT id, manager_id, is_manager_approver FROM users WHERE id = $1',
      [submitterId]
    );
    const submitter = userResult.rows[0];

    // Find matching approval rule based on the company currency amount
    const amountToCheck = expense.amount_in_company_currency || expense.amount;
    const rule = await findMatchingRuleWithClient(client, companyId, amountToCheck);

    if (!rule) {
      // No matching rule found — auto-approve the expense
      await client.query(
        `UPDATE expenses SET status = 'approved', current_approval_step = 0
         WHERE id = $1`,
        [expenseId]
      );
      await client.query('COMMIT');
      logger.info(`Expense ${expenseId} auto-approved (no matching rule)`);
      return { autoApproved: true };
    }

    // Get the rule steps ordered by step_number
    const stepsResult = await client.query(
      'SELECT * FROM approval_rule_steps WHERE rule_id = $1 ORDER BY step_number ASC',
      [rule.id]
    );
    let steps = stepsResult.rows;

    // Build the approval chain
    let approvalSteps = [];
    let stepOffset = 0;

    // If employee has is_manager_approver = true, prepend manager as Step 1
    if (submitter.is_manager_approver && submitter.manager_id) {
      stepOffset = 1;
      approvalSteps.push({
        step_number: 1,
        approver_id: submitter.manager_id,
        approver_role_label: 'Direct Manager',
      });
    }

    // Add the rule steps (renumbered with offset)
    for (const step of steps) {
      approvalSteps.push({
        step_number: step.step_number + stepOffset,
        approver_id: step.approver_id,
        approver_role_label: step.approver_role_label,
      });
    }

    // If no steps at all (rule exists but no steps defined), auto-approve
    if (approvalSteps.length === 0) {
      await client.query(
        `UPDATE expenses SET status = 'approved', current_approval_step = 0
         WHERE id = $1`,
        [expenseId]
      );
      await client.query('COMMIT');
      return { autoApproved: true };
    }

    // Create expense_approval rows for each step
    for (const step of approvalSteps) {
      await client.query(
        `INSERT INTO expense_approvals (expense_id, approver_id, step_number, status)
         VALUES ($1, $2, $3, 'pending')`,
        [expenseId, step.approver_id, step.step_number]
      );
    }

    // Update expense: status = pending, current_approval_step = 1
    await client.query(
      `UPDATE expenses SET status = 'pending', current_approval_step = 1
       WHERE id = $1`,
      [expenseId]
    );

    await client.query('COMMIT');

    logger.info(`Approval workflow initialized for expense ${expenseId} with ${approvalSteps.length} steps (rule: ${rule.name})`);

    return {
      autoApproved: false,
      rule: rule,
      steps: approvalSteps,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Internal helper: find matching rule using an existing client (for transactions)
 */
async function findMatchingRuleWithClient(client, companyId, amount) {
  const result = await client.query(
    `SELECT * FROM approval_rules
     WHERE company_id = $1
       AND is_active = true
       AND (min_amount IS NULL OR min_amount <= $2)
       AND (max_amount IS NULL OR max_amount >= $2)
     ORDER BY min_amount DESC NULLS LAST
     LIMIT 1`,
    [companyId, amount]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Process an approve/reject action from an approver.
 *
 * For SEQUENTIAL rules:
 *   - Must be the approver for the current step
 *   - On approve: advance to next step, or finish if last step
 *   - On reject: reject expense, skip remaining steps
 *
 * For CONDITIONAL rules:
 *   - Any approver in the workflow can act
 *   - On approve: check if approved_count / total >= threshold → auto-approve
 *   - On reject: increment rejection count, check if threshold impossible → reject
 *
 * For HYBRID rules:
 *   - If specific_approver approves → auto-approve immediately
 *   - Otherwise fall back to percentage threshold logic
 */
async function processAction(expenseId, approverId, companyId, action, comments = null) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Lock the expense row to prevent concurrent modifications
    const expenseResult = await client.query(
      'SELECT * FROM expenses WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [expenseId, companyId]
    );
    if (expenseResult.rows.length === 0) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }
    const expense = expenseResult.rows[0];

    // Verify expense is still pending
    if (expense.status !== 'pending') {
      const err = new Error(`Expense is already ${expense.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Find the approval row for this approver on this expense
    const approvalResult = await client.query(
      `SELECT * FROM expense_approvals
       WHERE expense_id = $1 AND approver_id = $2 AND status = 'pending'`,
      [expenseId, approverId]
    );
    if (approvalResult.rows.length === 0) {
      const err = new Error('You are not a pending approver for this expense');
      err.statusCode = 403;
      throw err;
    }
    const approval = approvalResult.rows[0];

    // Get the associated rule to determine logic type
    const amountToCheck = expense.amount_in_company_currency || expense.amount;
    const rule = await findMatchingRuleWithClient(client, companyId, amountToCheck);

    // Default to sequential if no rule found (shouldn't happen, but be defensive)
    const ruleType = rule ? rule.rule_type : 'sequential';

    if (action === 'reject') {
      // ---- REJECTION LOGIC (same for all rule types) ----
      // Update this approval row
      await client.query(
        `UPDATE expense_approvals SET status = 'rejected', comments = $1, decided_at = NOW()
         WHERE id = $2`,
        [comments, approval.id]
      );

      // Mark all remaining pending approvals as 'skipped'
      await client.query(
        `UPDATE expense_approvals SET status = 'skipped', decided_at = NOW()
         WHERE expense_id = $1 AND status = 'pending'`,
        [expenseId]
      );

      // Reject the expense
      await client.query(
        `UPDATE expenses SET status = 'rejected', rejection_reason = $1
         WHERE id = $2`,
        [comments || 'Rejected by approver', expenseId]
      );

      await client.query('COMMIT');

      await logAudit({
        companyId,
        actorId: approverId,
        action: 'EXPENSE_REJECTED',
        entityType: 'expense',
        entityId: expenseId,
        metadata: { step_number: approval.step_number, comments },
      });

      return { status: 'rejected', message: 'Expense rejected' };
    }

    // ---- APPROVAL LOGIC ----
    // Update this approval row
    await client.query(
      `UPDATE expense_approvals SET status = 'approved', comments = $1, decided_at = NOW()
       WHERE id = $2`,
      [comments, approval.id]
    );

    let finalStatus = null;

    if (ruleType === 'sequential') {
      // SEQUENTIAL: check if this is the current step, then advance
      if (approval.step_number !== expense.current_approval_step) {
        const err = new Error('It is not your turn to approve this expense');
        err.statusCode = 400;
        throw err;
      }

      // Check if there's a next step
      const nextStep = await client.query(
        `SELECT * FROM expense_approvals
         WHERE expense_id = $1 AND step_number > $2 AND status = 'pending'
         ORDER BY step_number ASC LIMIT 1`,
        [expenseId, approval.step_number]
      );

      if (nextStep.rows.length > 0) {
        // Advance to next step
        await client.query(
          'UPDATE expenses SET current_approval_step = $1 WHERE id = $2',
          [nextStep.rows[0].step_number, expenseId]
        );
        finalStatus = 'advanced';
      } else {
        // No more steps — fully approved!
        await client.query(
          `UPDATE expenses SET status = 'approved' WHERE id = $1`,
          [expenseId]
        );
        finalStatus = 'approved';
      }

    } else if (ruleType === 'conditional') {
      // CONDITIONAL: check percentage threshold
      const threshold = rule.percentage_threshold || 100;

      const countResult = await client.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
           COUNT(*) as total_count
         FROM expense_approvals WHERE expense_id = $1`,
        [expenseId]
      );
      const { approved_count, total_count } = countResult.rows[0];
      const approvedPct = (parseInt(approved_count) / parseInt(total_count)) * 100;

      if (approvedPct >= threshold) {
        // Threshold met — approve expense
        await client.query(
          `UPDATE expenses SET status = 'approved' WHERE id = $1`,
          [expenseId]
        );
        // Skip any remaining pending approvals
        await client.query(
          `UPDATE expense_approvals SET status = 'skipped', decided_at = NOW()
           WHERE expense_id = $1 AND status = 'pending'`,
          [expenseId]
        );
        finalStatus = 'approved';
      } else {
        finalStatus = 'advanced';
      }

    } else if (ruleType === 'hybrid') {
      // HYBRID: check specific approver first, then percentage
      if (rule.specific_approver_id && approverId === rule.specific_approver_id) {
        // Specific approver (e.g. CFO) approved → auto-approve immediately
        await client.query(
          `UPDATE expenses SET status = 'approved' WHERE id = $1`,
          [expenseId]
        );
        await client.query(
          `UPDATE expense_approvals SET status = 'skipped', decided_at = NOW()
           WHERE expense_id = $1 AND status = 'pending'`,
          [expenseId]
        );
        finalStatus = 'approved';
      } else {
        // Fall back to percentage threshold logic
        const threshold = rule.percentage_threshold || 100;
        const countResult = await client.query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
             COUNT(*) as total_count
           FROM expense_approvals WHERE expense_id = $1`,
          [expenseId]
        );
        const { approved_count, total_count } = countResult.rows[0];
        const approvedPct = (parseInt(approved_count) / parseInt(total_count)) * 100;

        if (approvedPct >= threshold) {
          await client.query(
            `UPDATE expenses SET status = 'approved' WHERE id = $1`,
            [expenseId]
          );
          await client.query(
            `UPDATE expense_approvals SET status = 'skipped', decided_at = NOW()
             WHERE expense_id = $1 AND status = 'pending'`,
            [expenseId]
          );
          finalStatus = 'approved';
        } else {
          finalStatus = 'advanced';
        }
      }
    }

    await client.query('COMMIT');

    await logAudit({
      companyId,
      actorId: approverId,
      action: finalStatus === 'approved' ? 'EXPENSE_APPROVED' : 'EXPENSE_STEP_APPROVED',
      entityType: 'expense',
      entityId: expenseId,
      metadata: { step_number: approval.step_number, comments, rule_type: ruleType },
    });

    return {
      status: finalStatus,
      message: finalStatus === 'approved'
        ? 'Expense fully approved'
        : 'Step approved, moved to next approver',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Admin override — force approve or reject an expense regardless of workflow state.
 */
async function adminOverride(expenseId, companyId, adminId, action, comments = null) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const expenseResult = await client.query(
      'SELECT * FROM expenses WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [expenseId, companyId]
    );
    if (expenseResult.rows.length === 0) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }

    const expense = expenseResult.rows[0];
    if (['approved', 'rejected', 'cancelled'].includes(expense.status)) {
      const err = new Error(`Expense is already ${expense.status}`);
      err.statusCode = 400;
      throw err;
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update expense status
    await client.query(
      `UPDATE expenses SET status = $1, rejection_reason = $2 WHERE id = $3`,
      [newStatus, action === 'reject' ? (comments || 'Admin override') : null, expenseId]
    );

    // Mark all pending approvals as skipped
    await client.query(
      `UPDATE expense_approvals SET status = 'skipped', comments = 'Admin override', decided_at = NOW()
       WHERE expense_id = $1 AND status = 'pending'`,
      [expenseId]
    );

    await client.query('COMMIT');

    await logAudit({
      companyId,
      actorId: adminId,
      action: `EXPENSE_ADMIN_${action.toUpperCase()}`,
      entityType: 'expense',
      entityId: expenseId,
      metadata: { comments, previous_status: expense.status },
    });

    return { status: newStatus, message: `Expense ${newStatus} by admin override` };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findMatchingRule,
  initializeWorkflow,
  processAction,
  adminOverride,
};
