const API_BASE_URL = "http://localhost:5000/api";

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem("ds_auth_token");
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};

// Transaction API functions
export const transactionAPI = {
  // Get all transactions
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiRequest(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  // Get single transaction
  getById: async (id: string) => {
    return apiRequest(`/transactions/${id}`);
  },

  // Create transaction
  create: async (data: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date?: string;
    tags?: string[];
    location?: string;
    paymentMethod?: string;
    recurring?: {
      isRecurring: boolean;
      frequency?: string;
    };
  }) => {
    return apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update transaction
  update: async (id: string, data: Partial<{
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
    tags: string[];
    location: string;
    paymentMethod: string;
  }>) => {
    return apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete transaction
  delete: async (id: string) => {
    return apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  // Get summary statistics
  getSummary: async (startDate?: string, endDate?: string) => {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append('startDate', startDate);
    if (endDate) searchParams.append('endDate', endDate);
    
    const queryString = searchParams.toString();
    return apiRequest(`/transactions/stats/summary${queryString ? `?${queryString}` : ''}`);
  },
};

// Loan API functions
export const loanAPI = {
  // Get all loans
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'completed' | 'defaulted' | 'prepaid';
    loanType?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiRequest(`/loans${queryString ? `?${queryString}` : ''}`);
  },

  // Get single loan
  getById: async (id: string) => {
    return apiRequest(`/loans/${id}`);
  },

  // Create loan
  create: async (data: {
    loanType: 'personal' | 'home' | 'car' | 'education' | 'business' | 'gold' | 'other';
    loanName: string;
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
    lender: string;
    startDate?: string;
    loanAccountNumber?: string;
    paymentFrequency?: 'monthly' | 'quarterly' | 'yearly';
    description?: string;
    tags?: string[];
    prepaymentAllowed?: boolean;
    prepaymentCharges?: number;
    insuranceAmount?: number;
    processingFee?: number;
    otherCharges?: number;
  }) => {
    return apiRequest('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update loan
  update: async (id: string, data: Partial<{
    loanType: 'personal' | 'home' | 'car' | 'education' | 'business' | 'gold' | 'other';
    loanName: string;
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
    lender: string;
    startDate: string;
    loanAccountNumber: string;
    paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
    description: string;
    tags: string[];
    prepaymentAllowed: boolean;
    prepaymentCharges: number;
    insuranceAmount: number;
    processingFee: number;
    otherCharges: number;
  }>) => {
    return apiRequest(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete loan
  delete: async (id: string) => {
    return apiRequest(`/loans/${id}`, {
      method: 'DELETE',
    });
  },

  // Record payment
  recordPayment: async (loanId: string, data: {
    amount: number;
    emiNumber: number;
    paymentDate?: string;
    paymentMethod?: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque' | 'auto-debit';
    notes?: string;
    lateFee?: number;
  }) => {
    return apiRequest(`/loans/${loanId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get EMI schedule
  getEMISchedule: async (loanId: string) => {
    return apiRequest(`/loans/${loanId}/emi-schedule`);
  },

  // Get payment history
  getPayments: async (loanId: string) => {
    return apiRequest(`/loans/${loanId}/payments`);
  },

  // Calculate EMI
  calculateEMI: async (data: {
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
  }) => {
    return apiRequest('/loans/calculate-emi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get summary statistics
  getSummary: async (status?: 'active' | 'completed' | 'defaulted' | 'prepaid') => {
    const searchParams = new URLSearchParams();
    if (status) searchParams.append('status', status);
    
    const queryString = searchParams.toString();
    return apiRequest(`/loans/stats/summary${queryString ? `?${queryString}` : ''}`);
  },

  // Get upcoming EMIs
  getUpcomingEMIs: async (days?: number) => {
    const searchParams = new URLSearchParams();
    if (days) searchParams.append('days', days.toString());
    
    const queryString = searchParams.toString();
    return apiRequest(`/loans/upcoming-emis${queryString ? `?${queryString}` : ''}`);
  },
};

// Goals API functions (we'll create this backend later)
export const goalsAPI = {
  // For now, we'll use localStorage until we create the goals backend
  getAll: async () => {
    const goals = localStorage.getItem('ds_savings_goals');
    return goals ? JSON.parse(goals) : [];
  },

  create: async (data: any) => {
    const goals = await goalsAPI.getAll();
    const newGoal = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    goals.push(newGoal);
    localStorage.setItem('ds_savings_goals', JSON.stringify(goals));
    return newGoal;
  },

  update: async (id: string, data: any) => {
    const goals = await goalsAPI.getAll();
    const index = goals.findIndex((goal: any) => goal.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...data };
      localStorage.setItem('ds_savings_goals', JSON.stringify(goals));
      return goals[index];
    }
    throw new Error('Goal not found');
  },

  delete: async (id: string) => {
    const goals = await goalsAPI.getAll();
    const filteredGoals = goals.filter((goal: any) => goal.id !== id);
    localStorage.setItem('ds_savings_goals', JSON.stringify(filteredGoals));
  },
};
