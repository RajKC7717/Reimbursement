/**
 * Approval Rules Routes (Admin only)
 */
const { Router } = require('express');
const controller = require('./rules.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { createRuleSchema, updateRuleSchema } = require('./rules.schema');

const router = Router();
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createRuleSchema), controller.create);
router.put('/:id', validate(updateRuleSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
