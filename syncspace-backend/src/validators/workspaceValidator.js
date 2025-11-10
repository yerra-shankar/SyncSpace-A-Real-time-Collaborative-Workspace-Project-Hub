// /src/validators/workspaceValidator.js

const { body, query, param } = require('express-validator');

/**
 * Validation rules for creating a workspace
 */
exports.validateWorkspaceCreate = [
  body('name')
    .notEmpty()
    .withMessage('Workspace name is required')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Workspace name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Workspace name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('type')
    .optional()
    .isIn(['personal', 'team', 'enterprise'])
    .withMessage('Type must be one of: personal, team, enterprise'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('settings.allowGuestAccess')
    .optional()
    .isBoolean()
    .withMessage('allowGuestAccess must be a boolean value'),

  body('settings.requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean value'),

  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters')
];

/**
 * Validation rules for updating a workspace
 */
exports.validateWorkspaceUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Workspace name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Workspace name can only contain letters, numbers, spaces, hyphens, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('type')
    .optional()
    .isIn(['personal', 'team', 'enterprise'])
    .withMessage('Type must be one of: personal, team, enterprise'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon must not exceed 50 characters'),

  body('archived')
    .optional()
    .isBoolean()
    .withMessage('archived must be a boolean value')
];

/**
 * Validation rules for adding a member to workspace
 */
exports.validateAddMember = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('role')
    .optional()
    .isIn(['owner', 'admin', 'member', 'guest'])
    .withMessage('Role must be one of: owner, admin, member, guest'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),

  body('permissions.*')
    .optional()
    .isIn(['read', 'write', 'delete', 'manage_members', 'manage_projects'])
    .withMessage('Invalid permission value')
];

/**
 * Validation rules for updating member role
 */
exports.validateUpdateMemberRole = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['owner', 'admin', 'member', 'guest'])
    .withMessage('Role must be one of: owner, admin, member, guest'),

  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),

  body('permissions.*')
    .optional()
    .isIn(['read', 'write', 'delete', 'manage_members', 'manage_projects'])
    .withMessage('Invalid permission value')
];

/**
 * Validation rules for workspace invitation
 */
exports.validateWorkspaceInvite = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['admin', 'member', 'guest'])
    .withMessage('Role must be one of: admin, member, guest'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),

  body('expiresIn')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Expiration must be between 1 and 30 days')
];

/**
 * Validation rules for workspace search
 */
exports.validateWorkspaceSearch = [
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('type')
    .optional()
    .isIn(['personal', 'team', 'enterprise', 'all'])
    .withMessage('Type must be one of: personal, team, enterprise, all'),

  query('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean value'),

  query('archived')
    .optional()
    .isBoolean()
    .withMessage('archived must be a boolean value'),

  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'memberCount'])
    .withMessage('Invalid sortBy field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * Validation rules for workspace settings update
 */
exports.validateWorkspaceSettings = [
  body('allowGuestAccess')
    .optional()
    .isBoolean()
    .withMessage('allowGuestAccess must be a boolean value'),

  body('requireApproval')
    .optional()
    .isBoolean()
    .withMessage('requireApproval must be a boolean value'),

  body('defaultProjectPrivacy')
    .optional()
    .isIn(['public', 'private', 'team'])
    .withMessage('Default project privacy must be one of: public, private, team'),

  body('allowMemberInvites')
    .optional()
    .isBoolean()
    .withMessage('allowMemberInvites must be a boolean value'),

  body('maxProjects')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('maxProjects must be between 1 and 1000'),

  body('maxMembers')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('maxMembers must be between 1 and 10000'),

  body('storageLimit')
    .optional()
    .isInt({ min: 100 })
    .withMessage('Storage limit must be at least 100 MB')
];

/**
 * Validation rules for workspace transfer
 */
exports.validateWorkspaceTransfer = [
  body('newOwnerId')
    .notEmpty()
    .withMessage('New owner ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('confirmTransfer')
    .notEmpty()
    .withMessage('Transfer confirmation is required')
    .isBoolean()
    .withMessage('confirmTransfer must be a boolean')
    .custom((value) => {
      if (value !== true) {
        throw new Error('You must confirm the workspace transfer');
      }
      return true;
    })
];