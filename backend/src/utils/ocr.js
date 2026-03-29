/**
 * OCR Utility — Tesseract.js Wrapper
 * Extracts text from receipt images and attempts to parse
 * amount, date, vendor name, and description.
 */
const Tesseract = require('tesseract.js');
const logger = require('../config/logger');

/**
 * Run OCR on an image file and extract structured data.
 * @param {string} filePath - Absolute path to the image file
 * @returns {object} { rawText, extracted: { amount, date, vendor, description } }
 */
async function extractReceiptData(filePath) {
  try {
    logger.info(`Running OCR on file: ${filePath}`);

    const { data } = await Tesseract.recognize(filePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const rawText = data.text;

    // Attempt to extract structured fields from raw OCR text
    const extracted = parseReceiptText(rawText);

    return {
      raw_text: rawText,
      confidence: data.confidence,
      extracted,
    };
  } catch (err) {
    logger.error('OCR processing failed', { error: err.message, filePath });
    throw new Error('Failed to process receipt image');
  }
}

/**
 * Parse raw OCR text to extract amount, date, vendor, description.
 * These are best-effort suggestions — user always confirms.
 */
function parseReceiptText(text) {
  const result = { amount: null, date: null, vendor: null, description: null };

  // Extract amounts: look for currency symbols or "total" patterns
  // Match patterns like: $123.45, ₹1,234.56, Total: 500.00, TOTAL 1234
  const amountPatterns = [
    /(?:total|amount|grand total|net|subtotal)[:\s]*[\$₹€£]?\s*([\d,]+\.?\d*)/i,
    /[\$₹€£]\s*([\d,]+\.?\d+)/,
    /(\d{1,3}(?:,\d{3})*\.\d{2})/,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract dates: look for common date formats
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,   // DD/MM/YYYY or MM/DD/YYYY
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,       // YYYY/MM/DD
    /(\w{3,9}\s+\d{1,2},?\s+\d{4})/i,               // January 1, 2024
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.date = match[1].trim();
      break;
    }
  }

  // Vendor: usually the first non-empty line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  if (lines.length > 0) {
    result.vendor = lines[0].substring(0, 100);
  }

  // Description: combine a few meaningful lines
  if (lines.length > 1) {
    result.description = lines.slice(0, 3).join(' ').substring(0, 200);
  }

  return result;
}

module.exports = { extractReceiptData };
