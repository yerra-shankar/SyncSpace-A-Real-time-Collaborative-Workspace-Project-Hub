/**
 * Notification Routes
 * Handles user notifications (global, not workspace-specific)
 */
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware'); // ✅ only protect, not verifyWorkspaceAccess

// ==================== Notification Routes ====================

// Get all notifications for logged-in user
router.get('/', protect, notificationController.getNotifications);

// Get unread count
router.get('/unread', protect, notificationController.getUnreadCount);

// Get notification by ID
router.get('/:id', protect, notificationController.getNotificationById);

// Mark single notification as read
router.patch('/:id/read', protect, notificationController.markAsRead);

// Mark all as read
router.patch('/read-all', protect, notificationController.markAllAsRead);

// Delete single notification
router.delete('/:id', protect, notificationController.deleteNotification);

// Delete all notifications
router.delete('/', protect, notificationController.deleteAllNotifications);

// Get by type
router.get('/type/:type', protect, notificationController.getNotificationsByType);

// Update preferences
router.post('/preferences', protect, notificationController.updatePreferences);

// Get preferences
router.get('/preferences', protect, notificationController.getPreferences);

// Send test notification
router.post('/test', protect, notificationController.sendTestNotification);

module.exports = router;
