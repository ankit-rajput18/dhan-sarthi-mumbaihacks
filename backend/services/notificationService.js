const Notification = require('../models/Notification');

class NotificationService {
  // Create a notification
  async createNotification(userId, data) {
    try {
      const notification = new Notification({
        userId,
        ...data
      });
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const {
      limit = 20,
      includeRead = true,
      includeDismissed = false
    } = options;

    const query = { userId };
    
    if (!includeRead) {
      query.read = false;
    }
    
    if (!includeDismissed) {
      query.dismissed = false;
    }

    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Get unread count
  async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  // Mark as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (notification) {
      return await notification.markAsRead();
    }
    return null;
  }

  // Mark all as read
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
  }

  // Dismiss notification
  async dismissNotification(notificationId, userId) {
    const notification = await Notification.findOne({ _id: notificationId, userId });
    if (notification) {
      return await notification.dismiss();
    }
    return null;
  }

  // Delete old notifications (cleanup)
  async deleteOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      dismissed: true
    });
  }

  // Specialized notification creators
  async notifyTransactionAdded(userId, amount, category) {
    return await this.createNotification(userId, {
      type: 'success',
      category: 'transaction',
      title: 'Transaction Added',
      message: `₹${amount.toLocaleString('en-IN')} added to ${category}`,
      priority: 'low',
      metadata: { amount, category }
    });
  }

  async notifyBudgetExceeded(userId, category, excessAmount, budget) {
    return await this.createNotification(userId, {
      type: 'warning',
      category: 'budget',
      title: 'Budget Alert',
      message: `You've exceeded your ${category} budget by ₹${excessAmount.toLocaleString('en-IN')}`,
      priority: 'high',
      actionUrl: '/planner',
      metadata: { category, excessAmount, budget }
    });
  }

  async notifyBudgetWarning(userId, category, percentage, spent, budget) {
    return await this.createNotification(userId, {
      type: 'warning',
      category: 'budget',
      title: 'Budget Warning',
      message: `You've used ${percentage}% of your ${category} budget (₹${spent.toLocaleString('en-IN')} of ₹${budget.toLocaleString('en-IN')})`,
      priority: 'medium',
      actionUrl: '/planner',
      metadata: { category, percentage, spent, budget }
    });
  }

  async notifyTaxSaving(userId, amount, tip) {
    return await this.createNotification(userId, {
      type: 'info',
      category: 'tax',
      title: 'Tax Saving Opportunity',
      message: tip,
      potentialSaving: amount,
      priority: 'high',
      actionUrl: '/tax-tips',
      metadata: { amount, tip }
    });
  }

  async notifyLoanPaymentDue(userId, loanName, daysLeft, amount) {
    const priority = daysLeft <= 3 ? 'high' : daysLeft <= 7 ? 'medium' : 'low';
    const type = daysLeft <= 3 ? 'danger' : 'warning';
    
    return await this.createNotification(userId, {
      type,
      category: 'loan',
      title: 'Loan Payment Due',
      message: `${loanName} payment of ₹${amount.toLocaleString('en-IN')} due in ${daysLeft} days`,
      priority,
      actionUrl: '/loans',
      metadata: { loanName, daysLeft, amount }
    });
  }

  async notifyGoalAchieved(userId, goalName, amount) {
    return await this.createNotification(userId, {
      type: 'success',
      category: 'goal',
      title: 'Goal Achieved! 🎉',
      message: `Congratulations! You've reached your ${goalName} goal of ₹${amount.toLocaleString('en-IN')}`,
      priority: 'high',
      actionUrl: '/planner',
      metadata: { goalName, amount }
    });
  }

  async notifyGoalProgress(userId, goalName, percentage, current, target) {
    return await this.createNotification(userId, {
      type: 'info',
      category: 'goal',
      title: 'Goal Progress',
      message: `You're ${percentage}% towards your ${goalName} goal (₹${current.toLocaleString('en-IN')} of ₹${target.toLocaleString('en-IN')})`,
      priority: 'low',
      actionUrl: '/planner',
      metadata: { goalName, percentage, current, target }
    });
  }

  async notifySavingsTip(userId, amount, tip) {
    return await this.createNotification(userId, {
      type: 'info',
      category: 'savings',
      title: 'Savings Tip',
      message: `Save ₹${amount.toLocaleString('en-IN')} by ${tip}`,
      potentialSaving: amount,
      priority: 'medium',
      metadata: { amount, tip }
    });
  }
}

module.exports = new NotificationService();
