const Loan = require('../models/Loan');
const Goal = require('../models/Goal');
const notificationService = require('./notificationService');
const intelligentNotificationService = require('./intelligentNotificationService');

class NotificationJobService {
  // Check for upcoming loan payments and create notifications
  async checkLoanPayments() {
    try {
      const loans = await Loan.find({ status: 'active' });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const loan of loans) {
        const nextEmi = loan.emiSchedule.find(e => e.status === 'pending');
        
        if (nextEmi) {
          const dueDate = new Date(nextEmi.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          
          // Notify at 7 days, 3 days, and 1 day before due
          if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1) {
            await notificationService.notifyLoanPaymentDue(
              loan.user,
              loan.loanName,
              daysUntilDue,
              nextEmi.emiAmount
            );
          }
          
          // Notify if overdue
          if (daysUntilDue < 0) {
            const daysOverdue = Math.abs(daysUntilDue);
            await notificationService.createNotification(loan.user, {
              type: 'danger',
              category: 'loan',
              title: 'Loan Payment Overdue!',
              message: `${loan.loanName} payment of ₹${nextEmi.emiAmount.toLocaleString('en-IN')} is ${daysOverdue} days overdue`,
              priority: 'high',
              actionUrl: '/loans',
              metadata: { loanName: loan.loanName, daysOverdue, amount: nextEmi.emiAmount }
            });
          }
        }
      }
      
      console.log('✅ Loan payment notifications checked');
    } catch (error) {
      console.error('Error checking loan payments:', error);
    }
  }

  // Check goal progress and create notifications
  async checkGoalProgress() {
    try {
      const goals = await Goal.find({ status: 'active' });
      
      for (const goal of goals) {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        
        // Notify at milestones: 25%, 50%, 75%, 90%, 100%
        const milestones = [25, 50, 75, 90, 100];
        const lastNotifiedMilestone = goal.lastNotifiedMilestone || 0;
        
        for (const milestone of milestones) {
          if (progress >= milestone && lastNotifiedMilestone < milestone) {
            if (milestone === 100) {
              await notificationService.notifyGoalAchieved(
                goal.user,
                goal.name,
                goal.targetAmount
              );
            } else {
              await notificationService.notifyGoalProgress(
                goal.user,
                goal.name,
                milestone,
                goal.currentAmount,
                goal.targetAmount
              );
            }
            
            // Update last notified milestone
            goal.lastNotifiedMilestone = milestone;
            await goal.save();
            break;
          }
        }
      }
      
      console.log('✅ Goal progress notifications checked');
    } catch (error) {
      console.error('Error checking goal progress:', error);
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications() {
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      // Get all users
      const users = await User.find();
      
      for (const user of users) {
        // Get all notifications for this user, sorted by newest first
        const allNotifications = await Notification.find({ userId: user._id })
          .sort({ createdAt: -1 });
        
        // Delete notifications older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const oldNotifications = allNotifications.filter(n => 
          new Date(n.createdAt) < sevenDaysAgo
        );
        
        if (oldNotifications.length > 0) {
          await Notification.deleteMany({
            _id: { $in: oldNotifications.map(n => n._id) }
          });
          console.log(`🗑️ Deleted ${oldNotifications.length} old notifications for user ${user.email}`);
        }
        
        // If user has more than 15 notifications, delete the oldest ones
        if (allNotifications.length > 15) {
          const notificationsToDelete = allNotifications.slice(15);
          await Notification.deleteMany({
            _id: { $in: notificationsToDelete.map(n => n._id) }
          });
          console.log(`🗑️ Deleted ${notificationsToDelete.length} excess notifications for user ${user.email}`);
        }
      }
      
      console.log('✅ Notification cleanup completed');
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }

  // Start periodic checks
  startPeriodicChecks() {
    // === EXISTING CHECKS ===
    // Check loan payments every hour
    setInterval(() => {
      this.checkLoanPayments();
    }, 60 * 60 * 1000); // 1 hour

    // Check goal progress every 6 hours
    setInterval(() => {
      this.checkGoalProgress();
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Clean up old notifications daily
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // === NEW INTELLIGENT CHECKS ===
    // Daily financial summary at 9 AM
    this.scheduleDailyTask(9, 0, () => {
      intelligentNotificationService.sendDailyFinancialSummary();
      intelligentNotificationService.detectUnusualSpending();
    });

    // Weekly checks on Monday at 9 AM
    this.scheduleWeeklyTask(1, 9, 0, () => {
      intelligentNotificationService.checkGoalDeadlines();
      intelligentNotificationService.forecastBudgetExceedance();
      intelligentNotificationService.checkEmergencyFund();
    });

    // Monthly checks on 1st at 10 AM
    this.scheduleMonthlyTask(1, 10, 0, () => {
      intelligentNotificationService.sendMonthlySummary();
      intelligentNotificationService.checkTaxDeadlines();
    });

    // Run immediately on startup
    this.checkLoanPayments();
    this.checkGoalProgress();
    this.cleanupOldNotifications();

    console.log('✅ Notification job service started with intelligent checks');
  }

  // Helper to schedule daily tasks at specific time
  scheduleDailyTask(hour, minute, task) {
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
    
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilFirst = scheduledTime - now;
    
    setTimeout(() => {
      task();
      setInterval(task, 24 * 60 * 60 * 1000); // Run daily
    }, timeUntilFirst);
  }

  // Helper to schedule weekly tasks
  scheduleWeeklyTask(dayOfWeek, hour, minute, task) {
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
    
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
    scheduledTime.setDate(scheduledTime.getDate() + daysUntilTarget);
    
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 7);
    }
    
    const timeUntilFirst = scheduledTime - now;
    
    setTimeout(() => {
      task();
      setInterval(task, 7 * 24 * 60 * 60 * 1000); // Run weekly
    }, timeUntilFirst);
  }

  // Helper to schedule monthly tasks
  scheduleMonthlyTask(dayOfMonth, hour, minute, task) {
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, minute, 0);
    
    if (now > scheduledTime) {
      scheduledTime.setMonth(scheduledTime.getMonth() + 1);
    }
    
    const timeUntilFirst = scheduledTime - now;
    
    setTimeout(() => {
      task();
      // Schedule next month
      const scheduleNext = () => {
        const nextRun = new Date();
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(dayOfMonth);
        nextRun.setHours(hour, minute, 0, 0);
        const timeUntilNext = nextRun - new Date();
        setTimeout(() => {
          task();
          scheduleNext();
        }, timeUntilNext);
      };
      scheduleNext();
    }, timeUntilFirst);
  }
}

module.exports = new NotificationJobService();
