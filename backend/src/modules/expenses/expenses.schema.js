/**
 * Expenses Module — Joi Schemas
 */
const Joi = require('joi');

const createExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(255).required(),
  description: Joi.string().max(500).allow('', null).optional(),
  amount: Joi.number().positive().precision(4).required(),
  currency_code: Joi.string().max(10).uppercase().required(),
  category_id: Joi.string().uuid().required(),
  expense_date: Joi.date().max('now').required(),
});

const updateExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  amount: Joi.number().positive().precision(4).optional(),
  currency_code: Joi.string().max(10).uppercase().optional(),
  category_id: Joi.string().uuid().optional(),
  expense_date: Joi.date().max('now').optional(),
}).min(1);

const approveRejectSchema = Joi.object({
  comments: Joi.string().max(500).allow('', null).optional(),
});

const overrideSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  comments: Joi.string().max(500).allow('', null).optional(),
});

module.exports = { createExpenseSchema, updateExpenseSchema, approveRejectSchema, overrideSchema };
