// /src/validators/userValidator.js

const { body, query } = require('express-validator');

/**
 * Validation rules for updating user profile
 */
exports.validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),

  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must not exceed 50 characters'),

  body('avatar')
    .optional()
    .trim()
    .isURL()
    .withMessage('Avatar must be a valid URL'),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Invalid role specified'),

  body('status')
    .optional()
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Invalid status value')
];

/**
 * Validation rules for user search
 */
exports.validateUserSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('status')
    .optional()
    .isIn(['online', 'offline', 'away', 'busy', 'all'])
    .withMessage('Invalid status filter'),

  query('role')
    .optional()
    .isIn(['user', 'admin', 'manager', 'all'])
    .withMessage('Invalid role filter')
];

/**
 * Validation rules for user status update
 */
exports.validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Status must be one of: online, offline, away, busy')
];

/**
 * Validation rules for avatar upload
 */
exports.validateAvatarUpload = [
  body('avatar')
    .optional()
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Please upload an avatar image');
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('Avatar must be a valid image file (JPEG, PNG, GIF, or WebP)');
      }
      
      // Check file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new Error('Avatar size must not exceed 5MB');
      }
      
      return true;
    })
];

/**
 * Validation rules for user preferences update
 */
exports.validatePreferencesUpdate = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be one of: light, dark, auto'),

  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'zh', 'ja'])
    .withMessage('Invalid language code'),

  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),

  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),

  body('notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),

  body('notifications.desktop')
    .optional()
    .isBoolean()
    .withMessage('Desktop notification preference must be a boolean'),

  body('emailFrequency')
    .optional()
    .isIn(['instant', 'daily', 'weekly', 'never'])
    .withMessage('Email frequency must be one of: instant, daily, weekly, never')
];

/**
 * Validation rules for bulk user operations
 */
exports.validateBulkUserOperation = [
  body('userIds')
    .notEmpty()
    .withMessage('User IDs are required')
    .isArray({ min: 1, max: 100 })
    .withMessage('User IDs must be an array with 1-100 items'),

  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be a valid MongoDB ID'),

  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['delete', 'activate', 'deactivate', 'changeRole'])
    .withMessage('Invalid action specified'),

  body('role')
    .if(body('action').equals('changeRole'))
    .notEmpty()
    .withMessage('Role is required for changeRole action')
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Invalid role specified')
];

/**
 * Validation rules for user invitation
 */
exports.validateUserInvitation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager'])
    .withMessage('Invalid role specified'),

  body('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters')
];