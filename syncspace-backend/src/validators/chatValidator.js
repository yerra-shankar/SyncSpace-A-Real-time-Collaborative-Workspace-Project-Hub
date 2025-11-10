// /src/validators/chatValidator.js

const { body, query, param } = require('express-validator');

/**
 * Validation rules for creating a message
 */
exports.validateMessageCreate = [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),

  body('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),

  body('receiver')
    .optional()
    .isMongoId()
    .withMessage('Invalid receiver ID format'),

  body('type')
    .optional()
    .isIn(['text', 'file', 'image', 'video', 'audio', 'system'])
    .withMessage('Invalid message type'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Attachment URL must be valid'),

  body('attachments.*.type')
    .optional()
    .isIn(['image', 'video', 'audio', 'document', 'file'])
    .withMessage('Invalid attachment type'),

  body('mentions')
    .optional()
    .isArray()
    .withMessage('Mentions must be an array'),

  body('mentions.*')
    .optional()
    .isMongoId()
    .withMessage('Each mentioned user ID must be valid'),

  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid message ID for reply'),

  body('threadId')
    .optional()
    .isMongoId()
    .withMessage('Invalid thread ID format')
];

/**
 * Validation rules for editing a message
 */
exports.validateMessageEdit = [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
];

/**
 * Validation rules for message reaction
 */
exports.validateMessageReaction = [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters')
];

/**
 * Validation rules for message search
 */
exports.validateMessageSearch = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
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

  query('senderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid sender ID format'),

  query('type')
    .optional()
    .isIn(['text', 'file', 'image', 'video', 'audio', 'system', 'all'])
    .withMessage('Invalid message type'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo'),

  query('hasAttachments')
    .optional()
    .isBoolean()
    .withMessage('hasAttachments must be a boolean value')
];

/**
 * Validation rules for creating a channel
 */
exports.validateChannelCreate = [
  body('name')
    .notEmpty()
    .withMessage('Channel name is required')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Channel name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Channel name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('workspaceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid workspace ID format'),

  body('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID format'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array'),

  body('members.*')
    .optional()
    .isMongoId()
    .withMessage('Each member ID must be valid')
];

/**
 * Validation rules for updating a channel
 */
exports.validateChannelUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Channel name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Channel name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  body('archived')
    .optional()
    .isBoolean()
    .withMessage('archived must be a boolean value')
];

/**
 * Validation rules for pinning a message
 */
exports.validateMessagePin = [
  body('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isMongoId()
    .withMessage('Invalid message ID format')
];

/**
 * Validation rules for message thread
 */
exports.validateThreadCreate = [
  body('messageId')
    .notEmpty()
    .withMessage('Message ID is required')
    .isMongoId()
    .withMessage('Invalid message ID format'),

  body('content')
    .notEmpty()
    .withMessage('Thread reply content is required')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Thread reply must be between 1 and 5000 characters')
];

/**
 * Validation rules for marking messages as read
 */
exports.validateMarkAsRead = [
  body('messageIds')
    .optional()
    .isArray()
    .withMessage('Message IDs must be an array'),

  body('messageIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each message ID must be valid'),

  body('channelId')
    .optional()
    .isMongoId()
    .withMessage('Invalid channel ID format'),

  body('beforeTimestamp')
    .optional()
    .isISO8601()
    .withMessage('Invalid timestamp format')
];