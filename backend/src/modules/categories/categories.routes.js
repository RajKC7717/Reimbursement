/**
 * Categories Routes
 */
const { Router } = require('express');
const controller = require('./categories.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { categorySchema } = require('./categories.schema');

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.post('/', requireRole('admin'), validate(categorySchema), controller.create);
router.put('/:id', requireRole('admin'), validate(categorySchema), controller.update);
router.delete('/:id', requireRole('admin'), controller.remove);

module.exports = router;
