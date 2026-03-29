/**
 * Categories Module — Schema
 */
const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});

module.exports = { categorySchema };
