/**
 * Approval Rules Module — Schema
 */
const Joi = require('joi');

const stepSchema = Joi.object({
  approver_id: Joi.string().uuid().required(),
  approver_role_label: Joi.string().max(100).allow('', null).optional(),
});

const createRuleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  rule_type: Joi.string().valid('sequential', 'conditional', 'hybrid').required(),
  min_amount: Joi.number().precision(4).allow(null).optional(),
  max_amount: Joi.number().precision(4).allow(null).optional(),
  percentage_threshold: Joi.number().integer().min(1).max(100).allow(null).optional(),
  specific_approver_id: Joi.string().uuid().allow(null).optional(),
  steps: Joi.array().items(stepSchema).min(1).required(),
});

const updateRuleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  rule_type: Joi.string().valid('sequential', 'conditional', 'hybrid').optional(),
  min_amount: Joi.number().precision(4).allow(null).optional(),
  max_amount: Joi.number().precision(4).allow(null).optional(),
  percentage_threshold: Joi.number().integer().min(1).max(100).allow(null).optional(),
  specific_approver_id: Joi.string().uuid().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  steps: Joi.array().items(stepSchema).min(1).optional(),
}).min(1);

module.exports = { createRuleSchema, updateRuleSchema };
