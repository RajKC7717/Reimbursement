/**
 * Role Guard Middleware
 * Restricts route access to specific user roles.
 * Must be used AFTER authenticate middleware.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole('admin'), handler)
 *   router.get('/managers', authenticate, requireRole('admin', 'manager'), handler)
 */
const { error } = require('../utils/apiResponse');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        403
      );
    }

    next();
  };
}

module.exports = requireRole;
