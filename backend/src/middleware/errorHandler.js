/**
 * Global Error Handler Middleware
 * MUST be the last middleware registered on the Express app.
 * Catches all errors and returns a consistent JSON response.
 */
const logger = require('../config/logger');
const env = require('../config/env');

function errorHandler(err, req, res, _next) {
  // Log the full error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id,
  });

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message || 'Internal server error',
    errors: err.errors || [],
  });
}

module.exports = errorHandler;
