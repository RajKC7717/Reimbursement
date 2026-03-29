/**
 * Auth Controller — Thin layer between routes and service.
 * Parses request, calls service, sends response.
 */
const authService = require('./auth.service');
const { success, error } = require('../../utils/apiResponse');

async function signup(req, res, next) {
  try {
    const data = await authService.signup(req.body);
    return success(res, data, 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    return success(res, data, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const data = await authService.refresh(req.body);
    return success(res, data, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const data = await authService.getProfile(req.user.id, req.user.company_id);
    return success(res, data, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getProfile,
};
