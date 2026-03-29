/**
 * Categories Controller
 */
const categoriesService = require('./categories.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try {
    const data = await categoriesService.listCategories(req.user.company_id);
    return success(res, data, 'Categories retrieved');
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await categoriesService.createCategory(req.user.company_id, req.body);
    return success(res, data, 'Category created', 201);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await categoriesService.updateCategory(req.params.id, req.user.company_id, req.body);
    return success(res, data, 'Category updated');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await categoriesService.deleteCategory(req.params.id, req.user.company_id);
    return success(res, null, 'Category deleted');
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
