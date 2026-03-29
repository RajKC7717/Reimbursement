/**
 * Users Module — Joi Schemas
 */
const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('admin', 'manager', 'employee').required(),
  manager_id: Joi.string().uuid().allow(null).optional(),
  is_manager_approver: Joi.boolean().default(false),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  role: Joi.string().valid('admin', 'manager', 'employee').optional(),
  manager_id: Joi.string().uuid().allow(null).optional(),
  is_manager_approver: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
}).min(1); // At least one field required

module.exports = { createUserSchema, updateUserSchema };
