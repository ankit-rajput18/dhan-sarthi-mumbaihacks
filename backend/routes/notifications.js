const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const { limit, includeRead, includeDismissed } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      req.user._id,
      {
        limit: parseInt(limit) || 20,
        includeRead: includeRead === 'true',
        includeDismissed: includeDismissed === 'true'
      }
    );

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.patch('/read-all', auth, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Dismiss notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await notificationService.dismissNotification(
      req.params.id,
      req.user._id
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

// Create test notification (for development)
router.post('/test', auth, async (req, res) => {
  try {
    const { type, title, message } = req.body;
    
    const notification = await notificationService.createNotification(
      req.user._id,
      {
        type: type || 'info',
        category: 'general',
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        priority: 'medium'
      }
    );

    res.json({ notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

module.exports = router;
