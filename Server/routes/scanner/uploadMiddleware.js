/**
 * scanner/uploadMiddleware.js
 * Multer configuration for file uploads
 */

const multer = require('multer');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// Storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(config.TEMP_UPLOAD_DIR, { recursive: true });
      cb(null, config.TEMP_UPLOAD_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
  cb(null, true);
};

// Multer upload instance
const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: config.MAX_FILES_PER_UPLOAD
  },
  fileFilter
});

module.exports = { upload };
