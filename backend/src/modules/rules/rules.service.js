/**
 * Approval Rules Service
 */
const { query, getClient } = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

async function listRules(companyId) {
  const rules = await query(
    `SELECT ar.*, 
       (SELECT COUNT(*) FROM approval_rule_steps WHERE rule_id = ar.id) as step_count
     FROM approval_rules ar
     WHERE ar.company_id = $1
     ORDER BY ar.created_at DESC`,
    [companyId]
  );
  return rules.rows;
}

async function getRuleById(ruleId, companyId) {
  const ruleResult = await query(
    'SELECT * FROM approval_rules WHERE id = $1 AND company_id = $2',
    [ruleId, companyId]
  );
  if (ruleResult.rows.length === 0) {
    const err = new Error('Approval rule not found');
    err.statusCode = 404;
    throw err;
  }

  const stepsResult = await query(
    `SELECT ars.*, u.name as approver_name, u.email as approver_email
     FROM approval_rule_steps ars
     JOIN users u ON ars.approver_id = u.id
     WHERE ars.rule_id = $1
     ORDER BY ars.step_number ASC`,
    [ruleId]
  );

  return {
    ...ruleResult.rows[0],
    steps: stepsResult.rows,
  };
}

async function createRule(companyId, data, actorId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const ruleResult = await client.query(
      `INSERT INTO approval_rules (company_id, name, rule_type, min_amount, max_amount, percentage_threshold, specific_approver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [companyId, data.name, data.rule_type, data.min_amount || null, data.max_amount || null,
       data.percentage_threshold || null, data.specific_approver_id || null]
    );
    const rule = ruleResult.rows[0];

    // Insert steps with auto-incrementing step_number
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      await client.query(
        `INSERT INTO approval_rule_steps (rule_id, step_number, approver_id, approver_role_label)
         VALUES ($1, $2, $3, $4)`,
        [rule.id, i + 1, step.approver_id, step.approver_role_label || null]
      );
    }

    await client.query('COMMIT');

    await logAudit({
      companyId, actorId,
      action: 'RULE_CREATED',
      entityType: 'approval_rule',
      entityId: rule.id,
      metadata: { name: data.name, rule_type: data.rule_type, steps_count: data.steps.length },
    });

    return getRuleById(rule.id, companyId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateRule(ruleId, companyId, data, actorId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Verify rule exists
    const existing = await client.query(
      'SELECT id FROM approval_rules WHERE id = $1 AND company_id = $2',
      [ruleId, companyId]
    );
    if (existing.rows.length === 0) {
      const err = new Error('Approval rule not found');
      err.statusCode = 404;
      throw err;
    }

    // Update rule fields
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.rule_type !== undefined) { fields.push(`rule_type = $${idx++}`); values.push(data.rule_type); }
    if (data.min_amount !== undefined) { fields.push(`min_amount = $${idx++}`); values.push(data.min_amount); }
    if (data.max_amount !== undefined) { fields.push(`max_amount = $${idx++}`); values.push(data.max_amount); }
    if (data.percentage_threshold !== undefined) { fields.push(`percentage_threshold = $${idx++}`); values.push(data.percentage_threshold); }
    if (data.specific_approver_id !== undefined) { fields.push(`specific_approver_id = $${idx++}`); values.push(data.specific_approver_id); }
    if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }

    if (fields.length > 0) {
      values.push(ruleId);
      await client.query(
        `UPDATE approval_rules SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    // Replace steps if provided
    if (data.steps) {
      await client.query('DELETE FROM approval_rule_steps WHERE rule_id = $1', [ruleId]);
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        await client.query(
          `INSERT INTO approval_rule_steps (rule_id, step_number, approver_id, approver_role_label)
           VALUES ($1, $2, $3, $4)`,
          [ruleId, i + 1, step.approver_id, step.approver_role_label || null]
        );
      }
    }

    await client.query('COMMIT');

    await logAudit({
      companyId, actorId,
      action: 'RULE_UPDATED',
      entityType: 'approval_rule',
      entityId: ruleId,
      metadata: data,
    });

    return getRuleById(ruleId, companyId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteRule(ruleId, companyId, actorId) {
  const result = await query(
    'DELETE FROM approval_rules WHERE id = $1 AND company_id = $2 RETURNING id, name',
    [ruleId, companyId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Approval rule not found');
    err.statusCode = 404;
    throw err;
  }

  await logAudit({
    companyId, actorId,
    action: 'RULE_DELETED',
    entityType: 'approval_rule',
    entityId: ruleId,
  });
}

module.exports = { listRules, getRuleById, createRule, updateRule, deleteRule };
