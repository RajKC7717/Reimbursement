/**
 * Company Service
 */
const { query } = require('../../config/db');
const { logAudit } = require('../../utils/auditLogger');

async function getCompany(companyId) {
  const result = await query(
    `SELECT c.id, c.name, c.default_currency_code, c.country_id, c.created_at, c.updated_at,
            co.name as country_name, co.currency_name, co.currency_symbol
     FROM companies c
     LEFT JOIN countries co ON c.country_id = co.id
     WHERE c.id = $1`,
    [companyId]
  );

  if (result.rows.length === 0) {
    const err = new Error('Company not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
}

async function updateCompany(companyId, data, actorId) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.country_id !== undefined) { fields.push(`country_id = $${idx++}`); values.push(data.country_id); }
  if (data.default_currency_code !== undefined) { fields.push(`default_currency_code = $${idx++}`); values.push(data.default_currency_code); }

  values.push(companyId);
  const result = await query(
    `UPDATE companies SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  await logAudit({
    companyId,
    actorId,
    action: 'COMPANY_UPDATED',
    entityType: 'company',
    entityId: companyId,
    metadata: data,
  });

  return result.rows[0];
}

async function listCountries({ page = 1, limit = 250 }) {
  const offset = (page - 1) * limit;
  const [dataResult, countResult] = await Promise.all([
    query('SELECT * FROM countries ORDER BY name ASC LIMIT $1 OFFSET $2', [limit, offset]),
    query('SELECT COUNT(*) as total FROM countries'),
  ]);

  return {
    countries: dataResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

async function getExchangeRates(baseCurrency) {
  const { getRates } = require('../../utils/currency');
  return getRates(baseCurrency);
}

module.exports = { getCompany, updateCompany, listCountries, getExchangeRates };
