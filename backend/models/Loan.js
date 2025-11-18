const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loanType: {
    type: String,
    required: [true, 'Loan type is required'],
    enum: ['personal', 'home', 'car', 'education', 'business', 'gold', 'other']
  },
  loanName: {
    type: String,
    required: [true, 'Loan name is required'],
    trim: true,
    maxlength: [100, 'Loan name cannot be more than 100 characters']
  },
  principalAmount: {
    type: Number,
    required: [true, 'Principal amount is required'],
    min: [0, 'Principal amount must be positive']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate must be positive'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  tenureMonths: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: [1, 'Tenure must be at least 1 month'],
    max: [600, 'Tenure cannot exceed 600 months (50 years)']
  },
  emiAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  totalInterest: {
    type: Number,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['Low Risk', 'Moderate Risk', 'High Risk'],
    default: 'Low Risk'
  },
  nextPaymentDate: {
    type: Date
  },
  paymentHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: Number,
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'paid'
    }
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  installmentDueDay: {
    type: Number,
    required: [true, 'Installment due day is required'],
    min: [1, 'Due day must be between 1 and 28'],
    max: [28, 'Due day must be between 1 and 28'],
    default: function() {
      return new Date(this.startDate).getDate();
    }
  },
  lender: {
    type: String,
    required: [true, 'Lender information is required'],
    trim: true,
    maxlength: [100, 'Lender name cannot be more than 100 characters']
  },
  loanAccountNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Account number cannot be more than 50 characters']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'prepaid'],
    default: 'active'
  },
  paymentFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  // EMI Schedule with monthly due dates
  emiSchedule: [{
    emiNumber: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    dueDateDay: {
      type: Number, // Day of month (1-31) for recurring due date
      required: true
    },
    principalAmount: {
      type: Number,
      required: true
    },
    interestAmount: {
      type: Number,
      required: true
    },
    emiAmount: {
      type: Number,
      required: true
    },
    remainingBalance: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'upcoming'],
      default: 'pending'
    },
    paidDate: {
      type: Date
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    lateFee: {
      type: Number,
      default: 0
    },
    daysOverdue: {
      type: Number,
      default: 0
    },
    alertSent: {
      type: Boolean,
      default: false
    }
  }],
  // Payment History
  payments: [{
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount must be positive']
    },
    emiNumber: {
      type: Number,
      required: true
    },
    principalPaid: {
      type: Number,
      required: true
    },
    interestPaid: {
      type: Number,
      required: true
    },
    lateFee: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'auto-debit'],
      default: 'cash'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot be more than 200 characters']
    }
  }],
  // Loan Statistics
  totalPaid: {
    type: Number,
    default: 0
  },
  principalPaid: {
    type: Number,
    default: 0
  },
  interestPaid: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    required: true
  },
  nextEmiDate: {
    type: Date,
    required: true
  },
  nextEmiAmount: {
    type: Number,
    required: true
  },
  // Additional Information
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Prepayment Information
  prepaymentAllowed: {
    type: Boolean,
    default: true
  },
  prepaymentCharges: {
    type: Number,
    default: 0
  },
  // Insurance and Other Charges
  insuranceAmount: {
    type: Number,
    default: 0
  },
  processingFee: {
    type: Number,
    default: 0
  },
  otherCharges: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
loanSchema.index({ user: 1, status: 1 });
loanSchema.index({ user: 1, loanType: 1 });
loanSchema.index({ user: 1, startDate: -1 });
loanSchema.index({ nextEmiDate: 1 });

// Virtual for loan progress percentage
loanSchema.virtual('progressPercentage').get(function() {
  return ((this.principalAmount - this.remainingBalance) / this.principalAmount) * 100;
});

// Virtual for days until next EMI
loanSchema.virtual('daysUntilNextEmi').get(function() {
  const today = new Date();
  const nextEmi = new Date(this.nextEmiDate);
  const diffTime = nextEmi - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to calculate EMI
loanSchema.methods.calculateEMI = function() {
  const principal = this.principalAmount;
  const rate = this.interestRate / (12 * 100); // Monthly interest rate
  const time = this.tenureMonths;
  
  if (rate === 0) {
    return principal / time;
  }
  
  const emi = (principal * rate * Math.pow(1 + rate, time)) / (Math.pow(1 + rate, time) - 1);
  return Math.round(emi);
};

// Method to generate EMI schedule with monthly due dates
loanSchema.methods.generateEMISchedule = function() {
  const schedule = [];
  let remainingBalance = this.principalAmount;
  const monthlyRate = this.interestRate / (12 * 100);
  const emiAmount = this.emiAmount;
  
  // Use the installmentDueDay field or fallback to start date day
  const dueDateDay = this.installmentDueDay || new Date(this.startDate).getDate();
  
  for (let i = 1; i <= this.tenureMonths; i++) {
    const interestAmount = remainingBalance * monthlyRate;
    const principalAmount = emiAmount - interestAmount;
    remainingBalance = Math.max(0, remainingBalance - principalAmount);
    
    const dueDate = new Date(this.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    // Set the due date to the installment due day each month
    // Handle month-end cases (e.g., if due day is 31 but month has only 30 days)
    const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
    dueDate.setDate(Math.min(dueDateDay, lastDayOfMonth));
    
    // Determine status based on due date
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    let status = 'pending';
    if (daysUntilDue > 7) {
      status = 'upcoming';
    } else if (daysUntilDue < 0) {
      status = 'overdue';
    }
    
    schedule.push({
      emiNumber: i,
      dueDate: dueDate,
      dueDateDay: dueDateDay,
      principalAmount: Math.round(principalAmount),
      interestAmount: Math.round(interestAmount),
      emiAmount: emiAmount,
      remainingBalance: Math.round(remainingBalance),
      status: status,
      daysOverdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0
    });
  }
  
  return schedule;
};

// Method to calculate loan risk
loanSchema.methods.calculateLoanRisk = function(userIncome) {
  if (!userIncome || userIncome <= 0) {
    return 'Low Risk'; // Default if income not available
  }

  const emi = this.emiAmount;
  const interest = this.interestRate;
  const tenure = this.tenureMonths;
  
  const ratio = emi / userIncome;
  let score = 0;

  // EMI to income ratio scoring
  if (ratio > 0.5) score += 5;
  else if (ratio > 0.3) score += 3;
  else score += 1;

  // Interest rate scoring
  if (interest > 12) score += 2;

  // Tenure scoring
  if (tenure > 36) score += 2;

  // Determine risk level
  if (score >= 8) return 'High Risk';
  if (score >= 4) return 'Moderate Risk';
  return 'Low Risk';
};

// Method to update loan status and EMI statuses
loanSchema.methods.updateLoanStatus = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if loan is completed
  if (this.remainingBalance <= 0) {
    this.status = 'completed';
    return;
  }
  
  // Update EMI statuses based on due dates
  this.emiSchedule.forEach(emi => {
    if (emi.status === 'paid') return;
    
    const dueDate = new Date(emi.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      emi.status = 'overdue';
      emi.daysOverdue = Math.abs(daysUntilDue);
    } else if (daysUntilDue <= 7) {
      emi.status = 'pending';
    } else {
      emi.status = 'upcoming';
    }
  });
  
  // Check for overdue EMIs
  const overdueEMIs = this.emiSchedule.filter(emi => emi.status === 'overdue');
  
  if (overdueEMIs.length > 0) {
    this.status = 'defaulted';
  } else {
    this.status = 'active';
  }
};

// Method to get installment summary
loanSchema.methods.getInstallmentSummary = function() {
  const total = this.emiSchedule.length;
  const paid = this.emiSchedule.filter(e => e.status === 'paid').length;
  const overdue = this.emiSchedule.filter(e => e.status === 'overdue').length;
  const pending = this.emiSchedule.filter(e => e.status === 'pending').length;
  const upcoming = this.emiSchedule.filter(e => e.status === 'upcoming').length;
  
  return {
    total,
    paid,
    remaining: total - paid,
    overdue,
    pending,
    upcoming,
    completionPercentage: ((paid / total) * 100).toFixed(1)
  };
};

// Method to get upcoming due dates
loanSchema.methods.getUpcomingDueDates = function(months = 3) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setMonth(today.getMonth() + months);
  
  return this.emiSchedule
    .filter(emi => emi.status !== 'paid' && emi.dueDate <= futureDate)
    .sort((a, b) => a.dueDate - b.dueDate)
    .map(emi => ({
      emiNumber: emi.emiNumber,
      dueDate: emi.dueDate,
      dueDateDay: emi.dueDateDay,
      amount: emi.emiAmount,
      status: emi.status,
      daysUntilDue: Math.ceil((emi.dueDate - today) / (1000 * 60 * 60 * 24)),
      daysOverdue: emi.daysOverdue
    }));
};

// Pre-validate middleware to calculate EMI and generate schedule before required-field validation
loanSchema.pre('validate', function(next) {
  if (this.isNew || this.isModified('principalAmount') || this.isModified('interestRate') || this.isModified('tenureMonths')) {
    // Calculate EMI
    this.emiAmount = this.calculateEMI();
    
    // Calculate total amount and interest
    this.totalAmount = this.emiAmount * this.tenureMonths;
    this.totalInterest = this.totalAmount - this.principalAmount;
    
    // Set end date
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.tenureMonths);
    this.endDate = endDate;
    
    // Set initial remaining balance
    this.remainingBalance = this.principalAmount;
    
    // Set next EMI date and amount using installmentDueDay
    const nextEmiDate = new Date(this.startDate);
    nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
    
    // Set the due date to the installment due day
    const dueDateDay = this.installmentDueDay || new Date(this.startDate).getDate();
    const lastDayOfMonth = new Date(nextEmiDate.getFullYear(), nextEmiDate.getMonth() + 1, 0).getDate();
    nextEmiDate.setDate(Math.min(dueDateDay, lastDayOfMonth));
    
    this.nextEmiDate = nextEmiDate;
    this.nextEmiAmount = this.emiAmount;
    
    // Generate EMI schedule
    this.emiSchedule = this.generateEMISchedule();
  }
  
  next();
});

module.exports = mongoose.model('Loan', loanSchema);

