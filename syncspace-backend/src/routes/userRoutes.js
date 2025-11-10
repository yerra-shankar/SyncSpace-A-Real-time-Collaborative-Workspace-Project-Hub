// src/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware'); // ✅ FIXED import
const roleMiddleware = require('../middlewares/roleMiddleware');
const { validateUserUpdate, validateUserSearch } = require('../validators/userValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get(
  '/',
  protect,
  roleMiddleware(['admin']),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or email
 * @access  Private
 */
router.get(
  '/search',
  protect,
  validateUserSearch,
  validationMiddleware,
  userController.searchUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', protect, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/:id',
  protect,
  validateUserUpdate,
  validationMiddleware,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  protect,
  roleMiddleware(['admin']),
  userController.deleteUser
);

/**
 * @route   POST /api/users/:id/upload-avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/:id/upload-avatar', protect, userController.uploadAvatar);

/**
 * @route   GET /api/users/:id/workspaces
 * @desc    Get all workspaces for a user
 * @access  Private
 */
router.get('/:id/workspaces', protect, userController.getUserWorkspaces);

/**
 * @route   GET /api/users/:id/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/:id/notifications', protect, userController.getUserNotifications);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user online status
 * @access  Private
 */
router.patch('/:id/status', protect, userController.updateUserStatus);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity history
 * @access  Private
 */
router.get('/:id/activity', protect, userController.getUserActivity);

module.exports = router;
