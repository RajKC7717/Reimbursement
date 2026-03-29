/**
 * Expenses Routes
 */
const { Router } = require('express');
const controller = require('./expenses.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const validate = require('../../middleware/validate');
const upload = require('../../middleware/upload');
const { createExpenseSchema, updateExpenseSchema, approveRejectSchema, overrideSchema } = require('./expenses.schema');

const router = Router();
router.use(authenticate);

// Submit expense (any authenticated user)
router.post('/', validate(createExpenseSchema), controller.submitExpense);

// List expenses (role-filtered in service)
router.get('/', controller.listExpenses);

// Get expense detail
router.get('/:id', controller.getExpenseById);

// Update draft expense (submitter only)
router.put('/:id', validate(updateExpenseSchema), controller.updateExpense);

// Cancel draft expense (submitter only)
router.delete('/:id', controller.cancelExpense);

// Approve expense (manager/admin)
router.post('/:id/approve', requireRole('admin', 'manager'), validate(approveRejectSchema), controller.approveExpense);

// Reject expense (manager/admin)
router.post('/:id/reject', requireRole('admin', 'manager'), validate(approveRejectSchema), controller.rejectExpense);

// Admin override
router.post('/:id/override', requireRole('admin'), validate(overrideSchema), controller.overrideExpense);

// OCR endpoint — upload receipt
router.post('/ocr', upload.single('receipt'), controller.submitExpense);

module.exports = router;
