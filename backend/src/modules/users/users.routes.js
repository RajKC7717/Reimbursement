/**
 * Users Routes
 */
const { Router } = require('express');
const controller = require('./users.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { createUserSchema, updateUserSchema } = require('./users.schema');

const router = Router();

// All user routes require authentication
router.use(authenticate);

// List all users (admin only)
router.get('/', requireRole('admin'), controller.listUsers);

// Get user by ID (admin only)
router.get('/:id', requireRole('admin'), controller.getUserById);

// Create user (admin only)
router.post('/', requireRole('admin'), validate(createUserSchema), controller.createUser);

// Update user (admin only)
router.put('/:id', requireRole('admin'), validate(updateUserSchema), controller.updateUser);

// Soft delete user (admin only)
router.delete('/:id', requireRole('admin'), controller.deleteUser);

module.exports = router;
