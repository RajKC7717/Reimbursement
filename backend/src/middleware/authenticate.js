/**
 * JWT Authentication Middleware
 * Verifies the access token from the Authorization header.
 * Attaches decoded user data to req.user.
 */
const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/apiResponse');
const logger = require('../config/logger');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return error(res, 'Access token is required', 401);
    }

    const decoded = verifyAccessToken(token);

    // Attach user info to request for downstream use
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      company_id: decoded.company_id,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Access token has expired', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid access token', 401);
    }
    logger.error('Authentication middleware error', { error: err.message });
    return error(res, 'Authentication failed', 401);
  }
}

module.exports = authenticate;
