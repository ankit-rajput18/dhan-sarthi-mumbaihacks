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
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
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
  // EMI Schedule
  emiSchedule: [{
    emiNumber: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
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
      enum: ['pending', 'paid', 'overdue'],
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

// Method to generate EMI schedule
loanSchema.methods.generateEMISchedule = function() {
  const schedule = [];
  let remainingBalance = this.principalAmount;
  const monthlyRate = this.interestRate / (12 * 100);
  const emiAmount = this.emiAmount;
  
  for (let i = 1; i <= this.tenureMonths; i++) {
    const interestAmount = remainingBalance * monthlyRate;
    const principalAmount = emiAmount - interestAmount;
    remainingBalance = Math.max(0, remainingBalance - principalAmount);
    
    const dueDate = new Date(this.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    schedule.push({
      emiNumber: i,
      dueDate: dueDate,
      principalAmount: Math.round(principalAmount),
      interestAmount: Math.round(interestAmount),
      emiAmount: emiAmount,
      remainingBalance: Math.round(remainingBalance),
      status: 'pending'
    });
  }
  
  return schedule;
};

// Method to update loan status
loanSchema.methods.updateLoanStatus = function() {
  const today = new Date();
  
  // Check if loan is completed
  if (this.remainingBalance <= 0) {
    this.status = 'completed';
    return;
  }
  
  // Check for overdue EMIs
  const overdueEMIs = this.emiSchedule.filter(emi => 
    emi.status === 'pending' && emi.dueDate < today
  );
  
  if (overdueEMIs.length > 0) {
    this.status = 'defaulted';
  } else {
    this.status = 'active';
  }
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
    
    // Set next EMI date and amount
    const nextEmiDate = new Date(this.startDate);
    nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
    this.nextEmiDate = nextEmiDate;
    this.nextEmiAmount = this.emiAmount;
    
    // Generate EMI schedule
    this.emiSchedule = this.generateEMISchedule();
  }
  
  next();
});

module.exports = mongoose.model('Loan', loanSchema);

