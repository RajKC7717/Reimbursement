/**
 * Standard API Response Helpers
 * Ensures consistent response shape across all endpoints.
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {object} data - Response data
 * @param {string} message - Human-readable message
 * @param {number} statusCode - HTTP status code (default 200)
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {Array<string>} errors - Detailed error messages
 */
function error(res, message = 'Something went wrong', statusCode = 400, errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

/**
 * Send a paginated success response
 * @param {import('express').Response} res
 * @param {Array} data - Array of items
 * @param {number} total - Total count of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message
 */
function paginated(res, data, total, page, limit, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { success, error, paginated };
