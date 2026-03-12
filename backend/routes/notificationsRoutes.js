/**
 * Notification Routes
 * Backend API endpoints for notification management
 */

const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  getNotificationsByRole,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotificationsByCategory,
  searchNotifications,
  getNotificationsByPriority,
} = require('../db/notificationsDB');

/**
 * GET /api/notifications
 * Get all notifications (admin only)
 */
router.get('/', (req, res) => {
  try {
    const notifications = getAllNotifications();
    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/:role
 * Get notifications for a specific role
 * Query params:
 *   - category: filter by category (Academic, Finance, Administrative, System, Alerts)
 *   - priority: filter by priority (Low, Medium, High, Critical)
 *   - status: filter by status (unread, read, archived)
 *   - search: search in title and message
 */
router.get('/:role', (req, res) => {
  try {
    const { role } = req.params;
    const { category, priority, status, search } = req.query;

    let notifications = getNotificationsByRole(role);

    // Apply filters
    if (category) {
      notifications = getNotificationsByCategory(role, category);
    } else if (priority) {
      notifications = getNotificationsByPriority(role, priority);
    } else if (search) {
      notifications = searchNotifications(role, search);
    }

    // Filter by status if provided
    if (status) {
      notifications = notifications.filter(n => n.status === status);
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      role,
      data: notifications,
      count: notifications.length,
      unreadCount: getUnreadCount(role)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/:role/unread
 * Get unread count for a role
 */
router.get('/:role/unread', (req, res) => {
  try {
    const { role } = req.params;
    const unreadCount = getUnreadCount(role);

    res.json({
      success: true,
      role,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 * Body:
 *   - title: string
 *   - message: string
 *   - senderRole: student|faculty|finance|admin
 *   - receiverRole: student|faculty|finance|admin|ALL
 *   - module: Academic|Finance|Administrative|System|Alerts
 *   - priority: Low|Medium|High|Critical
 *   - actionId: string (optional)
 *   - relatedData: object (optional)
 */
router.post('/', (req, res) => {
  try {
    const {
      title,
      message,
      senderRole,
      receiverRole,
      module,
      priority,
      actionId,
      relatedData
    } = req.body;

    // Validation
    if (!title || !message || !senderRole || !receiverRole || !module || !priority) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, message, senderRole, receiverRole, module, priority'
      });
    }

    const newNotification = createNotification({
      title,
      message,
      senderRole,
      receiverRole,
      module,
      priority,
      actionId: actionId || null,
      relatedData: relatedData || {}
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: newNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const notification = markAsRead(parseInt(id));

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:role/read-all
 * Mark all notifications as read for a role
 */
router.put('/:role/read-all', (req, res) => {
  try {
    const { role } = req.params;
    const notifications = markAllAsRead(role);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const notification = deleteNotification(parseInt(id));

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/:role/clear-all
 * Delete all notifications for a role
 */
router.post('/:role/clear-all', (req, res) => {
  try {
    const { role } = req.params;
    const notifications = getNotificationsByRole(role);
    let deletedCount = 0;

    // Delete all notifications for this role
    notifications.forEach(notif => {
      deleteNotification(notif.id);
      deletedCount++;
    });

    res.json({
      success: true,
      message: `${deletedCount} notifications cleared`,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
