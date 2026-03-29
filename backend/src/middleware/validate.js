/**
 * Joi Validation Middleware
 * Validates req.body, req.query, or req.params against a Joi schema.
 * Returns 400 with field-specific error messages on failure.
 *
 * Usage:
 *   router.post('/expenses', validate(expenseSchema), handler)
 *   router.get('/expenses', validate(querySchema, 'query'), handler)
 */
const { error } = require('../utils/apiResponse');

/**
 * @param {import('joi').Schema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of the request to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = req[source];

    const { error: validationError, value } = schema.validate(data, {
      abortEarly: false,    // Collect all errors, not just first
      stripUnknown: true,   // Remove unknown fields
      convert: true,        // Allow type coercion (e.g. string to number)
    });

    if (validationError) {
      const errors = validationError.details.map((d) => d.message);
      return error(res, 'Validation failed', 400, errors);
    }

    // Replace with validated + sanitized data
    req[source] = value;
    next();
  };
}

module.exports = validate;
