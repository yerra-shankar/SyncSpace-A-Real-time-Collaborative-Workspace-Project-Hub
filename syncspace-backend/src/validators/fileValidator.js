// /src/validators/fileValidator.js

const { body, query, param } = require('express-validator');

/**
 * Validation rules for file upload metadata
 */
exports.validateFileUpload = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('File name contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),

  body('taskId')
    .optional()
    .isMongoId()
    .withMessage('Invalid task ID format'),

  body('documentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid document ID format'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

/**
 * Validation rules for updating file metadata
 */
exports.validateFileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('File name contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

/**
 * Validation rules for file sharing
 */
exports.validateFileShare = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  body('permission')
    .notEmpty()
    .withMessage('Permission is required')
    .isIn(['view', 'download', 'edit'])
    .withMessage('Permission must be one of: view, download, edit'),

  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Expiration date cannot be in the past');
      }
      return true;
    })
];

/**
 * Validation rules for file search
 */
exports.validateFileSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  query('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),

  query('taskId')
    .optional()
    .isMongoId()
    .withMessage('Invalid task ID format'),

  query('fileType')
    .optional()
    .isIn(['image', 'video', 'audio', 'document', 'archive', 'code', 'all'])
    .withMessage('Invalid file type'),

  query('mimeType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('MIME type must not exceed 100 characters'),

  query('minSize')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum size must be a non-negative integer'),

  query('maxSize')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum size must be a non-negative integer'),

  query('uploadedBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),

  query('sortBy')
    .optional()
    .isIn(['name', 'size', 'uploadedAt', 'type'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for moving files
 */
exports.validateFileMove = [
  body('destinationWorkspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid destination workspace ID format'),

  body('destinationProjectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid destination project ID format'),

  body('destinationTaskId')
    .optional()
    .isMongoId()
    .withMessage('Invalid destination task ID format'),

  body('destinationDocumentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid destination document ID format')
];

/**
 * Validation rules for bulk file operations
 */
exports.validateBulkFileOperation = [
  body('fileIds')
    .notEmpty()
    .withMessage('File IDs are required')
    .isArray({ min: 1, max: 100 })
    .withMessage('File IDs must be an array with 1-100 items'),

  body('fileIds.*')
    .isMongoId()
    .withMessage('Each file ID must be valid'),

  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['delete', 'move', 'copy', 'archive', 'share'])
    .withMessage('Invalid action specified'),

  body('destination')
    .if(body('action').isIn(['move', 'copy']))
    .notEmpty()
    .withMessage('Destination is required for move/copy operations')
    .isObject()
    .withMessage('Destination must be an object')
];

/**
 * Validation rules for file version
 */
exports.validateFileVersion = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Version description must not exceed 500 characters'),

  body('isMajor')
    .optional()
    .isBoolean()
    .withMessage('isMajor must be a boolean value')
];

/**
 * Validation rules for generating download link
 */
exports.validateDownloadLink = [
  body('expiresIn')
    .optional()
    .isInt({ min: 60, max: 604800 })
    .withMessage('Expiration time must be between 60 seconds and 7 days'),

  body('maxDownloads')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Maximum downloads must be between 1 and 100'),

  body('password')
    .optional()
    .trim()
    .isLength({ min: 6, max: 50 })
    .withMessage('Password must be between 6 and 50 characters')
];

/**
 * Validation rules for file preview
 */
exports.validateFilePreview = [
  query('width')
    .optional()
    .isInt({ min: 50, max: 2000 })
    .withMessage('Width must be between 50 and 2000 pixels'),

  query('height')
    .optional()
    .isInt({ min: 50, max: 2000 })
    .withMessage('Height must be between 50 and 2000 pixels'),

  query('quality')
    .optional()
    .isIn(['low', 'medium', 'high', 'auto'])
    .withMessage('Quality must be one of: low, medium, high, auto'),

  query('format')
    .optional()
    .isIn(['jpg', 'png', 'webp', 'auto'])
    .withMessage('Format must be one of: jpg, png, webp, auto')
];