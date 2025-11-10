// /src/validators/projectValidator.js

const { body, query, param } = require('express-validator');

/**
 * Validation rules for creating a project
 */
exports.validateProjectCreate = [
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Project name can only contain letters, numbers, spaces, hyphens, underscores, and periods'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('workspaceId')
    .notEmpty()
    .withMessage('Workspace ID is required')
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'archived'])
    .withMessage('Status must be one of: planning, active, on-hold, completed, archived'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),

  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),

  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),

  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CNY'])
    .withMessage('Invalid currency code')
];

/**
 * Validation rules for updating a project
 */
exports.validateProjectUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Project name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Project name can only contain letters, numbers, spaces, hyphens, underscores, and periods'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'archived'])
    .withMessage('Status must be one of: planning, active, on-hold, completed, archived'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),

  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),

  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),

  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100')
];

/**
 * Validation rules for adding project member
 */
exports.validateAddProjectMember = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('role')
    .optional()
    .isIn(['owner', 'admin', 'member', 'viewer'])
    .withMessage('Role must be one of: owner, admin, member, viewer'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),

  body('permissions.*')
    .optional()
    .isIn(['read', 'write', 'delete', 'manage_tasks', 'manage_members'])
    .withMessage('Invalid permission value')
];

/**
 * Validation rules for project status update
 */
exports.validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['planning', 'active', 'on-hold', 'completed', 'archived'])
    .withMessage('Status must be one of: planning, active, on-hold, completed, archived'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
];

/**
 * Validation rules for project search
 */
exports.validateProjectSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  query('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'archived', 'all'])
    .withMessage('Invalid status filter'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'all'])
    .withMessage('Invalid priority filter'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),

  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'startDate', 'endDate', 'priority', 'progress'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for project milestone
 */
exports.validateMilestone = [
  body('title')
    .notEmpty()
    .withMessage('Milestone title is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Milestone title must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be one of: pending, in-progress, completed')
];

/**
 * Validation rules for project template
 */
exports.validateProjectTemplate = [
  body('name')
    .notEmpty()
    .withMessage('Template name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Template name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('category')
    .optional()
    .isIn(['software', 'marketing', 'design', 'research', 'general'])
    .withMessage('Invalid category'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];