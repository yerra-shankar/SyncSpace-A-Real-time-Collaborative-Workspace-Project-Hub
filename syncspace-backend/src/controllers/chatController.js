/**
 * Chat Controller
 * Handles workspace chat messages and real-time communication
 */

const Message = require('../models/Message');
const Workspace = require('../models/Workspace');
const Notification = require('../models/Notification');

/**
 * @desc    Get all messages in a workspace
 * @route   GET /api/workspaces/:workspaceId/messages
 * @access  Private
 */
exports.getMessagesByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.find({ 
      workspaceId,
      isDeleted: false
    })
      .populate('senderId', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('replyTo', 'text senderId')
      .populate('reactions.userId', 'name email avatar')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Reverse to show oldest first
    messages.reverse();

    // Get total count
    const total = await Message.countDocuments({ 
      workspaceId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send message to workspace
 * @route   POST /api/workspaces/:workspaceId/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { text, type, mentions, replyTo, attachments } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    // Create message
    const message = await Message.create({
      workspaceId,
      senderId: req.user._id,
      text: text.trim(),
      type: type || 'text',
      mentions: mentions || [],
      replyTo: replyTo || null,
      attachments: attachments || []
    });

    // Populate message
    await message.populate([
      { path: 'senderId', select: 'name email avatar' },
      { path: 'mentions', select: 'name email avatar' },
      { path: 'replyTo', select: 'text senderId' }
    ]);

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      const mentionNotifications = mentions
        .filter(userId => userId !== req.user._id.toString())
        .map(userId => ({
          userId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in ${workspaceId}`,
          workspaceId,
          senderId: req.user._id,
          link: `/workspace/${workspaceId}/chat`
        }));

      if (mentionNotifications.length > 0) {
        await Notification.insertMany(mentionNotifications);

        // Emit socket notifications
        const io = req.app.get('io');
        mentions.forEach(userId => {
          if (userId !== req.user._id.toString()) {
            io.to(`user:${userId}`).emit('notification:new', {
              type: 'mention',
              message: message
            });
          }
        });
      }
    }

    // Emit socket event to workspace
    const io = req.app.get('io');
    io.to(`workspace:${workspaceId}`).emit('chat:message', message);

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update message
 * @route   PUT /api/messages/:id
 * @access  Private
 */
exports.updateMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    message.text = text.trim();
    await message.markAsEdited();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${message.workspaceId}`).emit('chat:message:updated', {
      messageId: message._id,
      text: message.text,
      isEdited: true,
      editedAt: message.editedAt
    });

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete message (soft delete)
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await message.softDelete();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${message.workspaceId}`).emit('chat:message:deleted', {
      messageId: message._id
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add reaction to message
 * @route   POST /api/messages/:id/reactions
 * @access  Private
 */
exports.addReaction = async (req, res, next) => {
  try {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.addReaction(req.user._id, emoji);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${message.workspaceId}`).emit('chat:reaction:added', {
      messageId: message._id,
      userId: req.user._id,
      emoji
    });

    res.status(200).json({
      success: true,
      message: 'Reaction added successfully',
      reactions: message.reactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove reaction from message
 * @route   DELETE /api/messages/:id/reactions/:emoji
 * @access  Private
 */
exports.removeReaction = async (req, res, next) => {
  try {
    const { emoji } = req.params;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.removeReaction(req.user._id, emoji);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`workspace:${message.workspaceId}`).emit('chat:reaction:removed', {
      messageId: message._id,
      userId: req.user._id,
      emoji
    });

    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
      reactions: message.reactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark message as read
 * @route   POST /api/messages/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.markAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/workspaces/:workspaceId/messages/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const unreadCount = await Message.getUnreadCount(workspaceId, req.user._id);

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search messages in workspace
 * @route   GET /api/workspaces/:workspaceId/messages/search
 * @access  Private
 */
exports.searchMessages = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { query, limit = 20 } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const messages = await Message.find({
      workspaceId,
      isDeleted: false,
      $text: { $search: query }
    })
      .populate('senderId', 'name email avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// --- Compatibility aliases and route handlers expected by routes ---

// Route expects `getWorkspaceMessages` name
exports.getWorkspaceMessages = exports.getMessagesByWorkspace;

// Project messages - not implemented in current Message model (no projectId)
exports.getProjectMessages = async (req, res, next) => {
  try {
    // Not implemented: Message model doesn't store projectId in this scaffold
    return res.status(501).json({ success: false, message: 'Project messages not implemented' });
  } catch (error) {
    next(error);
  }
};

// Direct messages between users - not implemented in current scaffold
exports.getDirectMessages = async (req, res, next) => {
  try {
    return res.status(501).json({ success: false, message: 'Direct messages not implemented' });
  } catch (error) {
    next(error);
  }
};

// Get single message by ID
exports.getMessageById = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('senderId', 'name email avatar')
      .populate('mentions', 'name email avatar');

    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// editMessage route expects this name
exports.editMessage = exports.updateMessage;

// pin/unpin/pinned - not supported in current Message schema; return not implemented
exports.pinMessage = async (req, res, next) => {
  try {
    return res.status(501).json({ success: false, message: 'Pin message not implemented' });
  } catch (error) {
    next(error);
  }
};

exports.unpinMessage = async (req, res, next) => {
  try {
    return res.status(501).json({ success: false, message: 'Unpin message not implemented' });
  } catch (error) {
    next(error);
  }
};

exports.getPinnedMessages = async (req, res, next) => {
  try {
    return res.status(501).json({ success: false, message: 'Get pinned messages not implemented' });
  } catch (error) {
    next(error);
  }
};

// markMessageAsRead alias
exports.markMessageAsRead = exports.markAsRead;

// getUnreadCount: accept workspaceId from query or params
exports.getUnreadCount = async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId || req.params.workspaceId;
    if (!workspaceId) return res.status(400).json({ success: false, message: 'workspaceId is required (query param)' });
    const unreadCount = await Message.getUnreadCount(workspaceId, req.user._id);
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

// Typing indicator - emit socket event
exports.sendTypingIndicator = async (req, res, next) => {
  try {
    const { workspaceId, isTyping } = req.body;
    const io = req.app.get('io');
    if (io && workspaceId) {
      io.to(`workspace:${workspaceId}`).emit('chat:typing', { userId: req.user._id, isTyping: !!isTyping });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Channels - basic stubs
exports.createChannel = async (req, res, next) => {
  try {
    return res.status(501).json({ success: false, message: 'Channels not implemented' });
  } catch (error) {
    next(error);
  }
};

exports.getChannelMessages = async (req, res, next) => {
  try {
    return res.status(501).json({ success: false, message: 'Channel messages not implemented' });
  } catch (error) {
    next(error);
  }
};