/**
 * Audit Logs Routes (Admin only)
 */
const { Router } = require('express');
const controller = require('./audit.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

const router = Router();
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', controller.listLogs);

module.exports = router;
