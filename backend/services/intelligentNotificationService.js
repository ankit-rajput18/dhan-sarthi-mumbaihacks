const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');
const User = require('../models/User');
const notificationService = require('./notificationService');

class IntelligentNotificationService {
  
  // Daily Financial Summary (9 AM)
  async sendDailyFinancialSummary() {
    try {
      console.log('📊 Generating daily financial summaries...');
      const users = await User.find();
      
      for (const user of users) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Get this month's transactions
        const transactions = await Transaction.find({
          user: user._id,
          date: { $gte: startOfMonth }
        });
        
        const totalSpent = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (transactions.length > 0) {
          await notificationService.createNotification(user._id, {
            type: 'info',
            category: 'general',
            title: 'Daily Financial Summary',
            message: `This month: Income ₹${totalIncome.toLocaleString('en-IN')}, Spent ₹${totalSpent.toLocaleString('en-IN')}`,
            priority: 'low',
            actionUrl: '/dashboard'
          });
        }
      }
      
      console.log('✅ Daily summaries sent');
    } catch (error) {
      console.error('Error sending daily summaries:', error);
    }
  }

  // Unusual Spending Detection (Daily)
  async detectUnusualSpending() {
    try {
      console.log('🔍 Detecting unusual spending...');
      const users = await User.find();
      
      for (const user of users) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get today's expenses
        const todayExpenses = await Transaction.find({
          user: user._id,
          type: 'expense',
          date: { $gte: today, $lt: tomorrow }
        });
        
        const todayTotal = todayExpenses.reduce((sum, t) => sum + t.amount, 0);
        
        // Get last 30 days average
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentExpenses = await Transaction.find({
          user: user._id,
          type: 'expense',
          date: { $gte: thirtyDaysAgo, $lt: today }
        });
        
        if (recentExpenses.length > 0) {
          const avgDaily = recentExpenses.reduce((sum, t) => sum + t.amount, 0) / 30;
          
          // Alert if today's spending is 2x average
          if (todayTotal > avgDaily * 2 && todayTotal > 1000) {
            await notificationService.createNotification(user._id, {
              type: 'warning',
              category: 'transaction',
              title: 'Unusual Spending Detected',
              message: `You've spent ₹${todayTotal.toLocaleString('en-IN')} today, ${Math.round((todayTotal / avgDaily) * 100)}% of your daily average`,
              priority: 'medium',
              actionUrl: '/transactions'
            });
          }
        }
      }
      
      console.log('✅ Unusual spending check completed');
    } catch (error) {
      console.error('Error detecting unusual spending:', error);
    }
  }

  // Goal Deadline Warnings (Weekly)
  async checkGoalDeadlines() {
    try {
      console.log('🎯 Checking goal deadlines...');
      const goals = await Goal.find({ status: 'active' });
      
      for (const goal of goals) {
        const daysUntilDeadline = goal.daysUntilDeadline;
        const remaining = goal.remainingAmount;
        
        // Warn if deadline is within 30 days and goal not met
        if (daysUntilDeadline <= 30 && daysUntilDeadline > 0 && remaining > 0) {
          await notificationService.createNotification(goal.user, {
            type: 'warning',
            category: 'goal',
            title: 'Goal Deadline Approaching',
            message: `${goal.name} deadline in ${daysUntilDeadline} days. ₹${remaining.toLocaleString('en-IN')} remaining`,
            priority: daysUntilDeadline <= 7 ? 'high' : 'medium',
            actionUrl: '/planner'
          });
        }
        
        // Alert if goal is overdue
        if (daysUntilDeadline < 0 && remaining > 0) {
          await notificationService.createNotification(goal.user, {
            type: 'danger',
            category: 'goal',
            title: 'Goal Deadline Passed',
            message: `${goal.name} deadline was ${Math.abs(daysUntilDeadline)} days ago. ₹${remaining.toLocaleString('en-IN')} short`,
            priority: 'high',
            actionUrl: '/planner'
          });
        }
      }
      
      console.log('✅ Goal deadline check completed');
    } catch (error) {
      console.error('Error checking goal deadlines:', error);
    }
  }

  // Monthly Spending Summary (1st of month)
  async sendMonthlySummary() {
    try {
      console.log('📈 Generating monthly summaries...');
      const users = await User.find();
      
      for (const user of users) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        
        const transactions = await Transaction.find({
          user: user._id,
          date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });
        
        const totalSpent = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const savings = totalIncome - totalSpent;
        const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
        
        if (transactions.length > 0) {
          await notificationService.createNotification(user._id, {
            type: 'info',
            category: 'general',
            title: 'Monthly Financial Summary',
            message: `Last month: Income ₹${totalIncome.toLocaleString('en-IN')}, Spent ₹${totalSpent.toLocaleString('en-IN')}, Saved ${savingsRate}%`,
            priority: 'medium',
            actionUrl: '/dashboard'
          });
        }
      }
      
      console.log('✅ Monthly summaries sent');
    } catch (error) {
      console.error('Error sending monthly summaries:', error);
    }
  }

  // Budget Forecast (Weekly)
  async forecastBudgetExceedance() {
    try {
      console.log('🔮 Forecasting budget exceedance...');
      const users = await User.find();
      
      for (const user of users) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const budget = await Budget.findOne({
          user: user._id,
          month: currentMonth,
          year: currentYear
        });
        
        if (!budget) continue;
        
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const now = new Date();
        const daysElapsed = Math.ceil((now - startOfMonth) / (1000 * 60 * 60 * 24));
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysRemaining = daysInMonth - daysElapsed;
        
        for (const categoryBudget of budget.categories) {
          const transactions = await Transaction.find({
            user: user._id,
            type: 'expense',
            category: categoryBudget.category,
            date: { $gte: startOfMonth }
          });
          
          const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
          const dailyRate = spent / daysElapsed;
          const projected = spent + (dailyRate * daysRemaining);
          
          // Warn if projected to exceed budget
          if (projected > categoryBudget.allocated && spent < categoryBudget.allocated) {
            const daysUntilExceed = Math.ceil((categoryBudget.allocated - spent) / dailyRate);
            
            await notificationService.createNotification(user._id, {
              type: 'warning',
              category: 'budget',
              title: 'Budget Forecast Alert',
              message: `At current rate, you'll exceed ${categoryBudget.category} budget in ${daysUntilExceed} days`,
              priority: 'medium',
              actionUrl: '/planner'
            });
          }
        }
      }
      
      console.log('✅ Budget forecast completed');
    } catch (error) {
      console.error('Error forecasting budgets:', error);
    }
  }

  // Tax Deadline Reminders
  async checkTaxDeadlines() {
    try {
      console.log('📋 Checking tax deadlines...');
      const users = await User.find();
      const today = new Date();
      
      // ITR Filing deadline (July 31)
      const itrDeadline = new Date(today.getFullYear(), 6, 31); // July 31
      const daysUntilITR = Math.ceil((itrDeadline - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilITR > 0 && daysUntilITR <= 30) {
        for (const user of users) {
          await notificationService.createNotification(user._id, {
            type: 'warning',
            category: 'tax',
            title: 'ITR Filing Deadline',
            message: `Income Tax Return filing deadline in ${daysUntilITR} days (July 31)`,
            priority: daysUntilITR <= 7 ? 'high' : 'medium',
            actionUrl: '/tax-tips'
          });
        }
      }
      
      // 80C Investment deadline (March 31)
      const investmentDeadline = new Date(today.getFullYear(), 2, 31); // March 31
      const daysUntil80C = Math.ceil((investmentDeadline - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil80C > 0 && daysUntil80C <= 60) {
        for (const user of users) {
          await notificationService.createNotification(user._id, {
            type: 'info',
            category: 'tax',
            title: '80C Investment Deadline',
            message: `Save tax under Section 80C before March 31 (${daysUntil80C} days left)`,
            priority: daysUntil80C <= 15 ? 'high' : 'medium',
            potentialSaving: 46800, // Max saving at 30% tax rate
            actionUrl: '/tax-tips'
          });
        }
      }
      
      console.log('✅ Tax deadline check completed');
    } catch (error) {
      console.error('Error checking tax deadlines:', error);
    }
  }

  // Emergency Fund Check
  async checkEmergencyFund() {
    try {
      console.log('🆘 Checking emergency funds...');
      const users = await User.find();
      
      for (const user of users) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        
        const expenses = await Transaction.find({
          user: user._id,
          type: 'expense',
          date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });
        
        const monthlyExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        
        // Check for emergency fund goal
        const emergencyGoal = await Goal.findOne({
          user: user._id,
          name: { $regex: /emergency/i },
          status: 'active'
        });
        
        if (emergencyGoal && monthlyExpense > 0) {
          const monthsCovered = emergencyGoal.currentAmount / monthlyExpense;
          
          if (monthsCovered < 3) {
            await notificationService.createNotification(user._id, {
              type: 'warning',
              category: 'savings',
              title: 'Emergency Fund Low',
              message: `Your emergency fund covers only ${monthsCovered.toFixed(1)} months of expenses (recommended: 6 months)`,
              priority: 'medium',
              actionUrl: '/planner'
            });
          }
        }
      }
      
      console.log('✅ Emergency fund check completed');
    } catch (error) {
      console.error('Error checking emergency funds:', error);
    }
  }
}

module.exports = new IntelligentNotificationService();
