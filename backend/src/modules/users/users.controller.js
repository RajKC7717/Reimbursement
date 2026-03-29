/**
 * Users Controller
 */
const usersService = require('./users.service');
const { success, paginated } = require('../../utils/apiResponse');

async function listUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const { users, total } = await usersService.listUsers(req.user.company_id, { page, limit });
    return paginated(res, users, total, page, limit, 'Users retrieved');
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id, req.user.company_id);
    return success(res, user, 'User retrieved');
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await usersService.createUser(req.user.company_id, req.body, req.user.id);
    return success(res, user, 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.id, req.user.company_id, req.body, req.user.id);
    return success(res, user, 'User updated successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await usersService.deleteUser(req.params.id, req.user.company_id, req.user.id);
    return success(res, null, 'User deactivated successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
