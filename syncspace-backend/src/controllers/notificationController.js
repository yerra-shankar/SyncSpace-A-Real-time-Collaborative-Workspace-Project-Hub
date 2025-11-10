/**
 * Notification Controller
 * Handles user notifications and real-time alerts
 */

const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, isRead } = req.query;

    const query = { userId: req.user._id };
    if (isRead !== undefined) query.isRead = isRead === 'true';

    const notifications = await Notification.find(query)
      .populate('senderId', 'name email avatar')
      .populate('workspaceId', 'name')
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .populate('documentId', 'title')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single notification by ID
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('senderId', 'name email avatar')
      .populate('workspaceId', 'name')
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .populate('documentId', 'title');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all notifications for user
 * @route   DELETE /api/notifications
 * @access  Private
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notifications by type
 * @route   GET /api/notifications/type/:type
 * @access  Private
 */
exports.getNotificationsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { limit = 20 } = req.query;

    const notifications = await Notification.find({
      userId: req.user._id,
      type,
    })
      .populate('senderId', 'name email avatar')
      .populate('workspaceId', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update notification preferences (stub)
 * @route   POST /api/notifications/preferences
 * @access  Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    // Save user preferences in DB (you can extend this logic)
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      preferences: req.body,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification preferences (stub)
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
exports.getPreferences = async (req, res, next) => {
  try {
    // Fetch preferences (you can load from DB)
    res.status(200).json({
      success: true,
      preferences: {
        email: true,
        push: true,
        inApp: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send test notification (stub)
 * @route   POST /api/notifications/test
 * @access  Private
 */
exports.sendTestNotification = async (req, res, next) => {
  try {
    // Simulate test notification
    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully!',
    });
  } catch (error) {
    next(error);
  }
};
