const mockStorage = require('../utils/mockStorage');
const multer = require('multer');
const { sanitizeObject } = require('../utils/sanitizer');

// Allowed file types for photos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 5;

// Use memory storage for Vercel serverless (no persistent filesystem)
// Multer storage with memory storage
const storage = multer.memoryStorage();

// File filter for security
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Hanya file gambar (JPEG, PNG, WebP) yang diizinkan'), false);
  }
  if (file.size > MAX_FILE_SIZE) {
    return cb(new Error(`Ukuran file maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`), false);
  }
  cb(null, true);
};

exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

// @desc    Get all logs for a project with pagination
// @route   GET /api/logs/:projectId?page=1&limit=20
// @access  Private
exports.getLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const allLogs = mockStorage.find('logs', { project: req.params.projectId });
    const total = allLogs.length;
    const logs = allLogs.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new log with file uploads
// @route   POST /api/logs
// @access  Private
exports.createLog = async (req, res, next) => {
  try {
    req.body.user = String(req.user._id || req.user.id);
    req.body.project = req.body.project || req.query.projectId;

    // Validate basic required fields
    if (!req.body.project || !req.body.date || !req.body.description) {
      return res.status(400).json({
        success: false,
        message: 'Project, tanggal, dan deskripsi diperlukan'
      });
    }

    // Handle file uploads - store as base64 in memory
    if (req.files && req.files.length > 0) {
      req.body.photos = req.files.map(file => {
        const b64 = file.buffer.toString('base64');
        return `data:${file.mimetype};base64,${b64}`;
      });
    }

    const sanitized = sanitizeObject(req.body);
    const log = mockStorage.create('logs', sanitized);

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (err) {
    next(err);
  }
};
