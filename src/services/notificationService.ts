import { toast } from '@/hooks/use-toast';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  duration?: number;
}

class NotificationService {
  show({
    title,
    message,
    type = 'info',
    duration = 5000,
  }: NotificationOptions) {
    const variant = type === 'error' ? 'destructive' : 'default';

    toast({
      title,
      description: message,
      variant,
      duration,
    });
  }

  success(title: string, message: string, duration = 5000) {
    this.show({ title, message, type: 'success', duration });
  }

  error(title: string, message: string, duration = 7000) {
    this.show({ title, message, type: 'error', duration });
  }

  warning(title: string, message: string, duration = 6000) {
    this.show({ title, message, type: 'warning', duration });
  }

  info(title: string, message: string, duration = 5000) {
    this.show({ title, message, type: 'info', duration });
  }

  // Specialized notifications
  transactionAdded(amount: number, category: string) {
    this.success(
      'Transaction Added',
      `₹${amount.toLocaleString('en-IN')} added to ${category}`,
      4000
    );
  }

  budgetExceeded(category: string, amount: number) {
    this.warning(
      'Budget Alert',
      `You've exceeded your ${category} budget by ₹${amount.toLocaleString('en-IN')}`,
      7000
    );
  }

  taxSavingOpportunity(amount: number) {
    this.info(
      'Tax Saving Opportunity',
      `You could save up to ₹${amount.toLocaleString('en-IN')} in taxes`,
      8000
    );
  }

  loanPaymentDue(loanName: string, daysLeft: number) {
    this.warning(
      'Loan Payment Due',
      `${loanName} payment due in ${daysLeft} days`,
      6000
    );
  }

  goalAchieved(goalName: string) {
    this.success(
      'Goal Achieved! 🎉',
      `Congratulations! You've reached your ${goalName} goal`,
      6000
    );
  }

  savingsRecommendation(amount: number, reason: string) {
    this.info(
      'Savings Tip',
      `Save ₹${amount.toLocaleString('en-IN')} by ${reason}`,
      7000
    );
  }
}

export const notificationService = new NotificationService();
