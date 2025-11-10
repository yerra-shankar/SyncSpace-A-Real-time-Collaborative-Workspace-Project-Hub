// /src/validators/taskValidator.js

const { body, query, param } = require('express-validator');

/**
 * Validation rules for creating a task
 */
exports.validateTaskCreate = [
  body('title')
    .notEmpty()
    .withMessage('Task title is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Task title must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid project ID format'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog'])
    .withMessage('Status must be one of: todo, in-progress, review, done, backlog'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('assignedTo')
    .optional()
    .isArray()
    .withMessage('assignedTo must be an array'),

  body('assignedTo.*')
    .optional()
    .isMongoId()
    .withMessage('Each assigned user ID must be valid'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date cannot be in the past');
      }
      return true;
    }),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Estimated hours must be between 0 and 1000'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),

  body('dependencies')
    .optional()
    .isArray()
    .withMessage('Dependencies must be an array'),

  body('dependencies.*')
    .optional()
    .isMongoId()
    .withMessage('Each dependency must be a valid task ID'),

  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),

  body('checklist')
    .optional()
    .isArray()
    .withMessage('Checklist must be an array'),

  body('checklist.*.title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Checklist item title must be between 1 and 200 characters'),

  body('checklist.*.completed')
    .optional()
    .isBoolean()
    .withMessage('Checklist item completed must be a boolean')
];

/**
 * Validation rules for updating a task
 */
exports.validateTaskUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Task title must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog'])
    .withMessage('Status must be one of: todo, in-progress, review, done, backlog'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('assignedTo')
    .optional()
    .isArray()
    .withMessage('assignedTo must be an array'),

  body('assignedTo.*')
    .optional()
    .isMongoId()
    .withMessage('Each assigned user ID must be valid'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('estimatedHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Estimated hours must be between 0 and 1000'),

  body('actualHours')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Actual hours must be between 0 and 1000'),

  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array'),

  body('checklist')
    .optional()
    .isArray()
    .withMessage('Checklist must be an array')
];

/**
 * Validation rules for task status update
 */
exports.validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog'])
    .withMessage('Status must be one of: todo, in-progress, review, done, backlog'),

  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
];

/**
 * Validation rules for task priority update
 */
exports.validatePriorityUpdate = [
  body('priority')
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent')
];

/**
 * Validation rules for task assignment
 */
exports.validateTaskAssignment = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('role')
    .optional()
    .isIn(['assignee', 'reviewer', 'observer'])
    .withMessage('Role must be one of: assignee, reviewer, observer')
];

/**
 * Validation rules for task comment
 */
exports.validateComment = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),

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
 * Validation rules for task move (Kanban)
 */
exports.validateTaskMove = [
  body('fromStatus')
    .notEmpty()
    .withMessage('Source status is required')
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog'])
    .withMessage('Invalid source status'),

  body('toStatus')
    .notEmpty()
    .withMessage('Destination status is required')
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog'])
    .withMessage('Invalid destination status'),

  body('position')
    .notEmpty()
    .withMessage('Position is required')
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer')
];

/**
 * Validation rules for subtask
 */
exports.validateSubtask = [
  body('title')
    .notEmpty()
    .withMessage('Subtask title is required')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subtask title must be between 1 and 200 characters'),

  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean value'),

  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO 8601 date')
];

/**
 * Validation rules for task search
 */
exports.validateTaskSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),

  query('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog', 'all'])
    .withMessage('Invalid status filter'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent', 'all'])
    .withMessage('Invalid priority filter'),

  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),

  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),

  query('dueDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dueDateFrom'),

  query('dueDateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dueDateTo'),

  query('sortBy')
    .optional()
    .isIn(['title', 'createdAt', 'updatedAt', 'dueDate', 'priority', 'status'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for task attachment
 */
exports.validateAttachment = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Attachment name must be between 1 and 255 characters'),

  body('url')
    .optional()
    .isURL()
    .withMessage('Invalid URL format'),

  body('type')
    .optional()
    .isIn(['file', 'link', 'image', 'document'])
    .withMessage('Type must be one of: file, link, image, document')
];

/**
 * Validation rules for task time tracking
 */
exports.validateTimeLog = [
  body('hours')
    .notEmpty()
    .withMessage('Hours is required')
    .isFloat({ min: 0.1, max: 24 })
    .withMessage('Hours must be between 0.1 and 24'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

/**
 * Validation rules for bulk task operations
 */
exports.validateBulkTaskOperation = [
  body('taskIds')
    .notEmpty()
    .withMessage('Task IDs are required')
    .isArray({ min: 1, max: 100 })
    .withMessage('Task IDs must be an array with 1-100 items'),

  body('taskIds.*')
    .isMongoId()
    .withMessage('Each task ID must be valid'),

  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['delete', 'archive', 'updateStatus', 'updatePriority', 'assign'])
    .withMessage('Invalid action specified'),

  body('status')
    .if(body('action').equals('updateStatus'))
    .notEmpty()
    .withMessage('Status is required for updateStatus action')
    .isIn(['todo', 'in-progress', 'review', 'done', 'backlog'])
    .withMessage('Invalid status value'),

  body('priority')
    .if(body('action').equals('updatePriority'))
    .notEmpty()
    .withMessage('Priority is required for updatePriority action')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),

  body('userId')
    .if(body('action').equals('assign'))
    .notEmpty()
    .withMessage('User ID is required for assign action')
    .isMongoId()
    .withMessage('Invalid user ID format')
];