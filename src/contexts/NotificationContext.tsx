import { createContext, useContext, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (options: NotificationOptions) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const getVariant = (type: NotificationType) => {
    return type === 'error' ? 'destructive' : 'default';
  };

  const getPrefix = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✅ ';
      case 'error':
        return '❌ ';
      case 'warning':
        return '⚠️ ';
      case 'info':
        return 'ℹ️ ';
      default:
        return '';
    }
  };

  const showNotification = ({
    title,
    message,
    type = 'info',
    duration = 5000,
  }: NotificationOptions) => {
    const variant = getVariant(type);
    const prefix = getPrefix(type);

    toast({
      title: `${prefix}${title}`,
      description: message,
      variant,
      duration,
    });
  };

  const success = (title: string, message: string, duration = 5000) => {
    showNotification({ title, message, type: 'success', duration });
  };

  const error = (title: string, message: string, duration = 7000) => {
    showNotification({ title, message, type: 'error', duration });
  };

  const warning = (title: string, message: string, duration = 6000) => {
    showNotification({ title, message, type: 'warning', duration });
  };

  const info = (title: string, message: string, duration = 5000) => {
    showNotification({ title, message, type: 'info', duration });
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
