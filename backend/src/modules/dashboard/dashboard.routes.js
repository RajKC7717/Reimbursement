/**
 * Dashboard Routes
 */
const { Router } = require('express');
const controller = require('./dashboard.controller');
const authenticate = require('../../middleware/authenticate');

const router = Router();
router.use(authenticate);

router.get('/stats', controller.getStats);
router.get('/pending', controller.getPendingApprovals);

module.exports = router;
