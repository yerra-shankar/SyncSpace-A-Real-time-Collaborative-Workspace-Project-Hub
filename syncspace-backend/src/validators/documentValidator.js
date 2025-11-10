// /src/validators/documentValidator.js

const { body, query, param } = require('express-validator');

/**
 * Validation rules for creating a document
 */
exports.validateDocumentCreate = [
  body('title')
    .notEmpty()
    .withMessage('Document title is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Document title must be between 2 and 200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Document content must not exceed 100,000 characters'),

  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),

  body('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  body('type')
    .optional()
    .isIn(['text', 'markdown', 'html', 'code'])
    .withMessage('Type must be one of: text, markdown, html, code'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),

  body('template')
    .optional()
    .isMongoId()
    .withMessage('Invalid template ID format')
];

/**
 * Validation rules for updating a document
 */
exports.validateDocumentUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Document title must be between 2 and 200 characters'),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Document content must not exceed 100,000 characters'),

  body('type')
    .optional()
    .isIn(['text', 'markdown', 'html', 'code'])
    .withMessage('Type must be one of: text, markdown, html, code'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('archived')
    .optional()
    .isBoolean()
    .withMessage('archived must be a boolean value')
];

/**
 * Validation rules for sharing a document
 */
exports.validateDocumentShare = [
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
    .isIn(['view', 'comment', 'edit'])
    .withMessage('Permission must be one of: view, comment, edit'),

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
 * Validation rules for document comment
 */
exports.validateDocumentComment = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),

  body('position')
    .optional()
    .isObject()
    .withMessage('Position must be an object'),

  body('position.line')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Line must be a non-negative integer'),

  body('position.column')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Column must be a non-negative integer'),

  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array'),

  body('mentions.*')
    .optional()
    .isMongoId()
    .withMessage('Each mentioned user ID must be valid')
];

/**
 * Validation rules for document version
 */
exports.validateDocumentVersion = [
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
 * Validation rules for document search
 */
exports.validateDocumentSearch = [
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

  query('type')
    .optional()
    .isIn(['text', 'markdown', 'html', 'code', 'all'])
    .withMessage('Invalid document type'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),

  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'updatedAt', 'lastModified'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for document export
 */
exports.validateDocumentExport = [
  query('format')
    .notEmpty()
    .withMessage('Export format is required')
    .isIn(['pdf', 'docx', 'html', 'markdown', 'txt'])
    .withMessage('Format must be one of: pdf, docx, html, markdown, txt'),

  query('includeComments')
    .optional()
    .isBoolean()
    .withMessage('includeComments must be a boolean value'),

  query('includeMetadata')
    .optional()
    .isBoolean()
    .withMessage('includeMetadata must be a boolean value')
];

/**
 * Validation rules for document collaboration settings
 */
exports.validateCollaborationSettings = [
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('allowComments must be a boolean value'),

  body('allowSuggestions')
    .optional()
    .isBoolean()
    .withMessage('allowSuggestions must be a boolean value'),

  body('requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean value'),

  body('maxCollaborators')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('maxCollaborators must be between 1 and 100'),

  body('autoSave')
    .optional()
    .isBoolean()
    .withMessage('autoSave must be a boolean value'),

  body('versionControl')
    .optional()
    .isBoolean()
    .withMessage('versionControl must be a boolean value')
];