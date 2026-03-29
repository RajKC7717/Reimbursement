/**
 * Auth Module — Joi Validation Schemas
 */
const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string().email().trim().lowercase().required()
    .messages({ 'any.required': 'Email is required', 'string.email': 'Invalid email format' }),
  password: Joi.string().min(8).max(128).required()
    .messages({ 'any.required': 'Password is required', 'string.min': 'Password must be at least 8 characters' }),
  company_name: Joi.string().trim().min(2).max(255).required()
    .messages({ 'any.required': 'Company name is required' }),
  country_id: Joi.string().uuid().required()
    .messages({ 'any.required': 'Country is required', 'string.guid': 'Invalid country ID' }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string().required()
    .messages({ 'any.required': 'Password is required' }),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required()
    .messages({ 'any.required': 'Refresh token is required' }),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
};
