/**
 * Multer File Upload Middleware
 * Validates MIME type (image/jpeg, image/png, application/pdf).
 * Limits file size to 5MB.
 * Saves files to the configured upload directory.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types for receipt uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to prevent collisions
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, PDF`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = upload;
