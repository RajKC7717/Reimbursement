/**
 * Company Module — Schema, Service, Controller, Routes
 */

// ===== SCHEMA =====
const Joi = require('joi');

const updateCompanySchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  country_id: Joi.string().uuid().optional(),
  default_currency_code: Joi.string().max(10).uppercase().optional(),
}).min(1);

module.exports = { updateCompanySchema };
