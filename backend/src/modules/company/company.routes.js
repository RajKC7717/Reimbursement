/**
 * Company Routes
 */
const { Router } = require('express');
const controller = require('./company.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const { updateCompanySchema } = require('./company.schema');

const router = Router();

router.use(authenticate);

router.get('/', controller.getCompany);
router.put('/', requireRole('admin'), validate(updateCompanySchema), controller.updateCompany);

module.exports = router;
