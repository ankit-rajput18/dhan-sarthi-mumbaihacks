import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TransactionPattern {
  category: string;
  amount: number;
  description: string;
  date: Date;
}

export function useTaxBehaviorMonitor() {
  const { toast } = useToast();
  const lastNotificationTime = useRef<{ [key: string]: number }>({});
  const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

  const canShowNotification = (key: string): boolean => {
    const lastTime = lastNotificationTime.current[key];
    if (!lastTime) return true;
    return Date.now() - lastTime > NOTIFICATION_COOLDOWN;
  };

  const markNotificationShown = (key: string) => {
    lastNotificationTime.current[key] = Date.now();
  };

  // Monitor transaction additions
  const monitorTransaction = (transaction: TransactionPattern) => {
    const desc = transaction.description.toLowerCase();
    const cat = transaction.category.toLowerCase();
    const amount = transaction.amount;

    // Health Insurance Detection
    if ((desc.includes('health') || desc.includes('insurance') || desc.includes('medical')) && 
        amount > 5000 && canShowNotification('health-insurance')) {
      toast({
        title: '🏥 Tax Saving Detected!',
        description: `Your ₹${amount.toLocaleString('en-IN')} health insurance payment qualifies for 80D deduction. You could save up to ₹${Math.round(amount * 0.31).toLocaleString('en-IN')} in taxes!`,
        duration: 10000,
      });
      markNotificationShown('health-insurance');
    }

    // Mutual Fund/ELSS Detection
    if ((desc.includes('mutual fund') || desc.includes('elss') || desc.includes('sip')) && 
        amount > 1000 && canShowNotification('elss-investment')) {
      toast({
        title: '💰 Great Investment Choice!',
        description: `Your ₹${amount.toLocaleString('en-IN')} ELSS investment qualifies for 80C deduction. Keep investing to maximize your ₹1.5L limit!`,
        duration: 10000,
      });
      markNotificationShown('elss-investment');
    }

    // Rent Payment Detection
    if ((cat.includes('rent') || desc.includes('rent')) && 
        amount > 10000 && canShowNotification('rent-hra')) {
      toast({
        title: '🏠 HRA Opportunity!',
        description: `Paying ₹${amount.toLocaleString('en-IN')} rent? Make sure you're claiming HRA exemption. Update your tax profile to calculate potential savings!`,
        variant: 'default',
        duration: 10000,
      });
      markNotificationShown('rent-hra');
    }

    // Large Expense Warning
    if (transaction.amount > 50000 && canShowNotification('large-expense')) {
      toast({
        title: '⚠️ Large Expense Detected',
        description: `You just spent ₹${amount.toLocaleString('en-IN')}. Consider if this qualifies for any tax deductions (education, medical, home loan, etc.)`,
        variant: 'default',
        duration: 8000,
      });
      markNotificationShown('large-expense');
    }

    // Donation Detection
    if ((cat.includes('donation') || desc.includes('donation') || desc.includes('charity')) && 
        amount > 500 && canShowNotification('donation-80g')) {
      toast({
        title: '❤️ Tax Benefit on Donation',
        description: `Your ₹${amount.toLocaleString('en-IN')} donation may qualify for 80G deduction (50-100% depending on organization). Keep the receipt!`,
        duration: 10000,
      });
      markNotificationShown('donation-80g');
    }
  };

  // Monitor end of financial year
  useEffect(() => {
    const checkFinancialYearEnd = () => {
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const day = now.getDate();

      // January to March - Year-end tax planning
      if (month >= 1 && month <= 3 && canShowNotification('year-end-planning')) {
        toast({
          title: '🎯 Financial Year Ending Soon!',
          description: `Only ${4 - month} month(s) left to maximize tax savings. Complete your 80C investments, pay insurance premiums, and claim all deductions!`,
          variant: 'default',
          duration: 12000,
        });
        markNotificationShown('year-end-planning');
      }

      // December - Q3 Advance Tax
      if (month === 12 && day <= 15 && canShowNotification('advance-tax-q3')) {
        toast({
          title: '⚠️ Advance Tax Due Soon',
          description: 'Q3 advance tax payment due on December 15th. Calculate and pay to avoid penalties!',
          variant: 'destructive',
          duration: 15000,
        });
        markNotificationShown('advance-tax-q3');
      }

      // July - ITR Filing
      if (month === 7 && day <= 31 && canShowNotification('itr-filing')) {
        toast({
          title: '📝 File Your ITR',
          description: 'ITR filing deadline is July 31st. Gather your Form 16, investment proofs, and file your return!',
          variant: 'destructive',
          duration: 15000,
        });
        markNotificationShown('itr-filing');
      }
    };

    // Check on mount
    checkFinancialYearEnd();

    // Check daily
    const interval = setInterval(checkFinancialYearEnd, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    monitorTransaction
  };
}
