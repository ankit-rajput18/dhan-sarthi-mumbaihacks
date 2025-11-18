import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationService } from '@/services/notificationService';
import { useNotification } from '@/contexts/NotificationContext';
import { Bell, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function NotificationDemo() {
  const notification = useNotification();

  const testNotifications = () => {
    // Test different notification types
    setTimeout(() => {
      notification.success('Success!', 'Your transaction was added successfully');
    }, 500);

    setTimeout(() => {
      notification.info('New Feature', 'Check out the new AI Mentor feature');
    }, 1500);

    setTimeout(() => {
      notification.warning('Budget Alert', 'You are approaching your monthly budget limit');
    }, 2500);

    setTimeout(() => {
      notification.error('Payment Failed', 'Unable to process your payment. Please try again.');
    }, 3500);
  };

  const testSpecializedNotifications = () => {
    setTimeout(() => {
      notificationService.transactionAdded(5000, 'Food & Dining');
    }, 500);

    setTimeout(() => {
      notificationService.taxSavingOpportunity(25000);
    }, 1500);

    setTimeout(() => {
      notificationService.budgetExceeded('Shopping', 3000);
    }, 2500);

    setTimeout(() => {
      notificationService.loanPaymentDue('Home Loan', 5);
    }, 3500);

    setTimeout(() => {
      notificationService.goalAchieved('Emergency Fund');
    }, 4500);
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification System Demo
        </CardTitle>
        <CardDescription>
          Test the system-wide notification system with toast messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => notification.success('Success', 'Operation completed successfully')}
          >
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Success
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => notification.error('Error', 'Something went wrong')}
          >
            <AlertCircle className="w-4 h-4 text-red-600" />
            Error
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => notification.warning('Warning', 'Please review your settings')}
          >
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Warning
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => notification.info('Info', 'Here is some useful information')}
          >
            <Info className="w-4 h-4 text-blue-600" />
            Info
          </Button>
        </div>

        <div className="pt-4 border-t space-y-2">
          <Button
            onClick={testNotifications}
            className="w-full"
            variant="default"
          >
            Test All Basic Notifications
          </Button>
          
          <Button
            onClick={testSpecializedNotifications}
            className="w-full"
            variant="secondary"
          >
            Test Specialized Notifications
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          <p>✨ Notifications appear in the bottom-right corner</p>
          <p>🔔 Check the notification bell icon in the header for tax alerts</p>
        </div>
      </CardContent>
    </Card>
  );
}
