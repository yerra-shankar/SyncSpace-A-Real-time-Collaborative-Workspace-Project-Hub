// /src/socket/notificationSocket.js

const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification socket handler
 */
const notificationSocket = (io, socket) => {

  /**
   * Subscribe to notifications
   */
  socket.on('notification:subscribe', () => {
    try {
      // User is already joined to their personal room in socketHandlers
      // Just acknowledge subscription
      socket.emit('notification:subscribed', {
        userId: socket.userId,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} subscribed to notifications`);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      socket.emit('notification:error', { message: 'Failed to subscribe to notifications' });
    }
  });

  /**
   * Unsubscribe from notifications
   */
  socket.on('notification:unsubscribe', () => {
    try {
      socket.emit('notification:unsubscribed', {
        userId: socket.userId,
        timestamp: new Date()
      });

      console.log(`User ${socket.userId} unsubscribed from notifications`);
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    }
  });

  /**
   * Mark notification as read
   */
  socket.on('notification:read', async (data) => {
    try {
      const { notificationId } = data;

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return socket.emit('notification:error', { message: 'Notification not found' });
      }

      // Check if notification belongs to user
      if (notification.recipient.toString() !== socket.userId) {
        return socket.emit('notification:error', { message: 'Access denied' });
      }

      notification.read = true;
      notification.readAt = new Date();
      await notification.save();

      socket.emit('notification:read:success', {
        notificationId,
        timestamp: new Date()
      });

      console.log(`Notification ${notificationId} marked as read by ${socket.userId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('notification:error', { message: 'Failed to mark notification as read' });
    }
  });

  /**
   * Mark all notifications as read
   */
  socket.on('notification:read:all', async () => {
    try {
      await Notification.updateMany(
        { recipient: socket.userId, read: false },
        { read: true, readAt: new Date() }
      );

      socket.emit('notification:read:all:success', {
        timestamp: new Date()
      });

      console.log(`All notifications marked as read for user ${socket.userId}`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      socket.emit('notification:error', { message: 'Failed to mark all notifications as read' });
    }
  });

  /**
   * Delete notification
   */
  socket.on('notification:delete', async (data) => {
    try {
      const { notificationId } = data;

      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return socket.emit('notification:error', { message: 'Notification not found' });
      }

      // Check if notification belongs to user
      if (notification.recipient.toString() !== socket.userId) {
        return socket.emit('notification:error', { message: 'Access denied' });
      }

      await notification.deleteOne();

      socket.emit('notification:deleted', {
        notificationId,
        timestamp: new Date()
      });

      console.log(`Notification ${notificationId} deleted by ${socket.userId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      socket.emit('notification:error', { message: 'Failed to delete notification' });
    }
  });

  /**
   * Delete all notifications
   */
  socket.on('notification:delete:all', async () => {
    try {
      await Notification.deleteMany({ recipient: socket.userId });

      socket.emit('notification:deleted:all', {
        timestamp: new Date()
      });

      console.log(`All notifications deleted for user ${socket.userId}`);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      socket.emit('notification:error', { message: 'Failed to delete all notifications' });
    }
  });

  /**
   * Get unread notification count
   */
  socket.on('notification:unread:count', async () => {
    try {
      const count = await Notification.countDocuments({
        recipient: socket.userId,
        read: false
      });

      socket.emit('notification:unread:count:result', {
        count,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      socket.emit('notification:error', { message: 'Failed to get unread count' });
    }
  });

  /**
   * Update notification preferences
   */
  socket.on('notification:preferences:update', async (data) => {
    try {
      const { preferences } = data;

      const user = await User.findById(socket.userId);
      if (!user) {
        return socket.emit('notification:error', { message: 'User not found' });
      }

      // Update user notification preferences
      if (!user.notificationPreferences) {
        user.notificationPreferences = {};
      }

      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...preferences
      };

      await user.save();

      socket.emit('notification:preferences:updated', {
        preferences: user.notificationPreferences,
        timestamp: new Date()
      });

      console.log(`Notification preferences updated for user ${socket.userId}`);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      socket.emit('notification:error', { message: 'Failed to update notification preferences' });
    }
  });

};

/**
 * Helper function to send notification to a user
 * This can be called from other parts of the application
 */
const sendNotification = async (io, recipientId, notificationData) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      ...notificationData,
      createdAt: new Date()
    });

    await notification.populate('sender', 'name email avatar');

    // Send notification via socket if user is online
    io.to(`user:${recipientId}`).emit('notification:new', {
      notification,
      timestamp: new Date()
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send notification to multiple users
 */
const sendNotificationToMultiple = async (io, recipientIds, notificationData) => {
  try {
    const notifications = [];

    for (const recipientId of recipientIds) {
      const notification = await Notification.create({
        recipient: recipientId,
        ...notificationData,
        createdAt: new Date()
      });

      await notification.populate('sender', 'name email avatar');
      notifications.push(notification);

      // Send notification via socket if user is online
      io.to(`user:${recipientId}`).emit('notification:new', {
        notification,
        timestamp: new Date()
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    throw error;
  }
};

/**
 * Send workspace notification
 */
const sendWorkspaceNotification = async (io, workspaceId, notificationData, excludeUserId = null) => {
  try {
    const Workspace = require('../models/Workspace');
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Get all workspace members except excluded user
    const recipientIds = workspace.members
      .map(m => m.user.toString())
      .filter(userId => userId !== excludeUserId);

    return await sendNotificationToMultiple(io, recipientIds, notificationData);
  } catch (error) {
    console.error('Error sending workspace notification:', error);
    throw error;
  }
};

/**
 * Send project notification
 */
const sendProjectNotification = async (io, projectId, notificationData, excludeUserId = null) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Get all project members except excluded user
    const recipientIds = project.members
      .map(m => m.user.toString())
      .filter(userId => userId !== excludeUserId);

    return await sendNotificationToMultiple(io, recipientIds, notificationData);
  } catch (error) {
    console.error('Error sending project notification:', error);
    throw error;
  }
};

/**
 * Send task assignment notification
 */
const sendTaskAssignmentNotification = async (io, taskId, assignedUserId, assignedByUserId) => {
  try {
    const Task = require('../models/Task');
    const task = await Task.findById(taskId).populate('project', 'name');
    const assignedBy = await User.findById(assignedByUserId).select('name');

    if (!task || !assignedBy) {
      throw new Error('Task or user not found');
    }

    const notificationData = {
      type: 'task_assigned',
      title: 'New Task Assignment',
      message: `${assignedBy.name} assigned you a task: ${task.title}`,
      sender: assignedByUserId,
      relatedTask: taskId,
      relatedProject: task.project._id,
      link: `/projects/${task.project._id}/tasks/${taskId}`
    };

    return await sendNotification(io, assignedUserId, notificationData);
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    throw error;
  }
};

/**
 * Send mention notification
 */
const sendMentionNotification = async (io, mentionedUserId, mentionedByUserId, context, contentPreview) => {
  try {
    const mentionedBy = await User.findById(mentionedByUserId).select('name');

    if (!mentionedBy) {
      throw new Error('User not found');
    }

    const notificationData = {
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentionedBy.name} mentioned you: ${contentPreview}`,
      sender: mentionedByUserId,
      ...context // Include context like relatedTask, relatedProject, relatedDocument, etc.
    };

    return await sendNotification(io, mentionedUserId, notificationData);
  } catch (error) {
    console.error('Error sending mention notification:', error);
    throw error;
  }
};

/**
 * Send deadline reminder notification
 */
const sendDeadlineReminderNotification = async (io, userId, taskId) => {
  try {
    const Task = require('../models/Task');
    const task = await Task.findById(taskId).populate('project', 'name');

    if (!task) {
      throw new Error('Task not found');
    }

    const notificationData = {
      type: 'deadline_reminder',
      title: 'Task Deadline Approaching',
      message: `Task "${task.title}" is due soon`,
      relatedTask: taskId,
      relatedProject: task.project._id,
      link: `/projects/${task.project._id}/tasks/${taskId}`,
      priority: 'high'
    };

    return await sendNotification(io, userId, notificationData);
  } catch (error) {
    console.error('Error sending deadline reminder notification:', error);
    throw error;
  }
};

/**
 * Send system notification
 */
const sendSystemNotification = async (io, userId, title, message, options = {}) => {
  try {
    const notificationData = {
      type: 'system',
      title,
      message,
      ...options
    };

    return await sendNotification(io, userId, notificationData);
  } catch (error) {
    console.error('Error sending system notification:', error);
    throw error;
  }
};

module.exports = notificationSocket;
module.exports.sendNotification = sendNotification;
module.exports.sendNotificationToMultiple = sendNotificationToMultiple;
module.exports.sendWorkspaceNotification = sendWorkspaceNotification;
module.exports.sendProjectNotification = sendProjectNotification;
module.exports.sendTaskAssignmentNotification = sendTaskAssignmentNotification;
module.exports.sendMentionNotification = sendMentionNotification;
module.exports.sendDeadlineReminderNotification = sendDeadlineReminderNotification;
module.exports.sendSystemNotification = sendSystemNotification;