// syncspace-backend/src/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect, verifyWorkspaceAccess } = require('../middlewares/authMiddleware');
const { validateMessageCreate } = require('../validators/chatValidator');
const validationMiddleware = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/chat/messages
 * @desc    Send a new message
 * @access  Private
 */
router.post(
  '/messages',
  protect,
  validateMessageCreate,
  validationMiddleware,
  chatController.sendMessage
);

/**
 * @route   GET /api/chat/workspace/:workspaceId/messages
 * @desc    Get all messages in a workspace
 * @access  Private
 */
router.get(
  '/workspace/:workspaceId/messages',
  protect,
  verifyWorkspaceAccess,
  chatController.getWorkspaceMessages
);

/**
 * @route   GET /api/chat/project/:projectId/messages
 * @desc    Get all messages in a project
 * @access  Private
 */
router.get(
  '/project/:projectId/messages',
  protect,
  verifyWorkspaceAccess,
  chatController.getProjectMessages
);

/**
 * @route   GET /api/chat/direct/:userId/messages
 * @desc    Get direct messages with a specific user
 * @access  Private
 */
router.get('/direct/:userId/messages', protect, chatController.getDirectMessages);

/**
 * @route   GET /api/chat/messages/:id
 * @desc    Get message by ID
 * @access  Private
 */
router.get('/messages/:id', protect, chatController.getMessageById);

/**
 * @route   PUT /api/chat/messages/:id
 * @desc    Edit message
 * @access  Private
 */
router.put('/messages/:id', protect, chatController.editMessage);

/**
 * @route   DELETE /api/chat/messages/:id
 * @desc    Delete message
 * @access  Private
 */
router.delete('/messages/:id', protect, chatController.deleteMessage);

/**
 * @route   POST /api/chat/messages/:id/react
 * @desc    Add reaction to message
 * @access  Private
 */
router.post('/messages/:id/react', protect, chatController.addReaction);

/**
 * @route   DELETE /api/chat/messages/:id/react
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete('/messages/:id/react', protect, chatController.removeReaction);

/**
 * @route   POST /api/chat/messages/:id/pin
 * @desc    Pin message
 * @access  Private
 */
router.post('/messages/:id/pin', protect, chatController.pinMessage);

/**
 * @route   DELETE /api/chat/messages/:id/pin
 * @desc    Unpin message
 * @access  Private
 */
router.delete('/messages/:id/pin', protect, chatController.unpinMessage);

/**
 * @route   GET /api/chat/workspace/:workspaceId/pinned
 * @desc    Get pinned messages in workspace
 * @access  Private
 */
router.get(
  '/workspace/:workspaceId/pinned',
  protect,
  verifyWorkspaceAccess,
  chatController.getPinnedMessages
);

/**
 * @route   POST /api/chat/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post('/messages/:id/read', protect, chatController.markMessageAsRead);

/**
 * @route   GET /api/chat/unread
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread', protect, chatController.getUnreadCount);

/**
 * @route   POST /api/chat/typing
 * @desc    Send typing indicator
 * @access  Private
 */
router.post('/typing', protect, chatController.sendTypingIndicator);

/**
 * @route   GET /api/chat/search
 * @desc    Search messages
 * @access  Private
 */
router.get('/search', protect, chatController.searchMessages);

/**
 * @route   POST /api/chat/channels
 * @desc    Create a chat channel
 * @access  Private
 */
router.post('/channels', protect, verifyWorkspaceAccess, chatController.createChannel);

/**
 * @route   GET /api/chat/channels/:channelId/messages
 * @desc    Get messages in a channel
 * @access  Private
 */
router.get(
  '/channels/:channelId/messages',
  protect,
  verifyWorkspaceAccess,
  chatController.getChannelMessages
);

module.exports = router;
