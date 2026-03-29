/**
 * Categories Service
 */
const { query } = require('../../config/db');

async function listCategories(companyId) {
  const result = await query(
    'SELECT * FROM expense_categories WHERE company_id = $1 ORDER BY name ASC',
    [companyId]
  );
  return result.rows;
}

async function createCategory(companyId, { name }) {
  const result = await query(
    `INSERT INTO expense_categories (company_id, name) VALUES ($1, $2)
     RETURNING *`,
    [companyId, name]
  );
  return result.rows[0];
}

async function updateCategory(categoryId, companyId, { name }) {
  const result = await query(
    `UPDATE expense_categories SET name = $1 WHERE id = $2 AND company_id = $3 RETURNING *`,
    [name, categoryId, companyId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

async function deleteCategory(categoryId, companyId) {
  const result = await query(
    'DELETE FROM expense_categories WHERE id = $1 AND company_id = $2 RETURNING id',
    [categoryId, companyId]
  );
  if (result.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
