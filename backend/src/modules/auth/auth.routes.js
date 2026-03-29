/**
 * Auth Routes
 */
const { Router } = require('express');
const controller = require('./auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { signupSchema, loginSchema, refreshSchema } = require('./auth.schema');

const router = Router();

// Public routes
router.post('/signup', validate(signupSchema), controller.signup);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);

// Protected routes
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getProfile);

module.exports = router;
