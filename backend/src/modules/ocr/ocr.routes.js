/**
 * OCR Routes
 */
const { Router } = require('express');
const controller = require('./ocr.controller');
const authenticate = require('../../middleware/authenticate');
const upload = require('../../middleware/upload');

const router = Router();
router.use(authenticate);

// Upload receipt image and get OCR data
router.post('/', upload.single('receipt'), controller.processReceipt);

module.exports = router;
