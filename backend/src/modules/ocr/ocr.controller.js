/**
 * OCR Controller
 */
const { extractReceiptData } = require('../../utils/ocr');
const { success, error } = require('../../utils/apiResponse');

async function processReceipt(req, res, next) {
  try {
    if (!req.file) {
      return error(res, 'Receipt image is required', 400);
    }

    const result = await extractReceiptData(req.file.path);

    return success(res, {
      filename: req.file.filename,
      receipt_url: `/uploads/${req.file.filename}`,
      ocr_data: result,
    }, 'Receipt processed successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { processReceipt };
