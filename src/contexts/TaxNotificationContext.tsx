import { createContext, useContext, ReactNode } from 'react';

interface TaxNotificationContextType {
  checkForOpportunities: () => Promise<void>;
}

const TaxNotificationContext = createContext<TaxNotificationContextType | undefined>(undefined);

export function TaxNotificationProvider({ children }: { children: ReactNode }) {
  // Placeholder for future tax opportunity checks
  const checkForOpportunities = async () => {
    // Disabled temporarily - AI insights endpoint causing 500 errors
    return;
  };

  return (
    <TaxNotificationContext.Provider value={{ checkForOpportunities }}>
      {children}
    </TaxNotificationContext.Provider>
  );
}

export function useTaxNotifications() {
  const context = useContext(TaxNotificationContext);
  if (!context) {
    throw new Error('useTaxNotifications must be used within TaxNotificationProvider');
  }
  return context;
}
