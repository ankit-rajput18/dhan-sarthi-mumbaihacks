const mongoose = require('mongoose');

const userMemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  lastExpenses: {
    type: String,
    default: ''
  },
  goalsSummary: {
    type: String,
    default: ''
  },
  activeLoans: [{
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    },
    loanName: String,
    emiAmount: Number,
    riskLevel: String,
    summary: String
  }],
  taxTips: [{
    type: String
  }],
  lastAIAdvice: {
    type: String,
    default: ''
  },
  financialProfile: {
    avgMonthlyIncome: {
      type: Number,
      default: 0
    },
    avgMonthlyExpenses: {
      type: Number,
      default: 0
    },
    savingsRate: {
      type: Number,
      default: 0
    },
    topSpendingCategories: [{
      category: String,
      percentage: Number
    }]
  },
  extractedFacts: {
    mentionedGoals: [String],
    incomeSource: String,
    riskTolerance: String,
    spendingHabits: [String],
    lifeEvents: [String],
    preferences: [String],
    lastExtracted: Date
  },
  behavioralInsights: {
    recurringExpenses: [{
      description: String,
      frequency: Number
    }],
    transactionCount: Number,
    lastAnalyzed: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
userMemorySchema.index({ userId: 1 });
userMemorySchema.index({ updatedAt: -1 });

// Method to update memory with latest financial data
userMemorySchema.methods.updateFromFinancialData = function(analysis) {
  const { currentMonth, topCategories, goals, loans } = analysis;

  // Update last expenses summary
  this.lastExpenses = `₹${currentMonth.expenses.toLocaleString()} spent this month, ${currentMonth.savingsRate}% savings rate. Top categories: ${topCategories.slice(0, 3).map(c => `${c.category} (${c.percentage}%)`).join(', ')}`;

  // Update goals summary
  if (goals && goals.length > 0) {
    this.goalsSummary = `${goals.length} active goals: ${goals.map(g => `${g.name} (${g.progress}% complete)`).join(', ')}`;
  } else {
    this.goalsSummary = 'No active financial goals set';
  }

  // Update active loans
  if (loans && loans.length > 0) {
    this.activeLoans = loans.map(l => ({
      loanName: l.name,
      emiAmount: l.emi,
      riskLevel: l.riskLevel || 'Unknown',
      summary: `${l.type} loan: ₹${l.emi.toLocaleString()}/month EMI, ₹${l.remaining.toLocaleString()} remaining`
    }));
  } else {
    this.activeLoans = [];
  }

  // Update financial profile
  this.financialProfile = {
    avgMonthlyIncome: currentMonth.income,
    avgMonthlyExpenses: currentMonth.expenses,
    savingsRate: parseFloat(currentMonth.savingsRate),
    topSpendingCategories: topCategories.slice(0, 5).map(c => ({
      category: c.category,
      percentage: parseFloat(c.percentage)
    }))
  };

  this.updatedAt = new Date();
};

// Static method to get or create memory for a user
userMemorySchema.statics.getOrCreate = async function(userId) {
  let memory = await this.findOne({ userId });
  
  if (!memory) {
    memory = await this.create({
      userId,
      lastExpenses: '',
      goalsSummary: '',
      activeLoans: [],
      taxTips: [],
      lastAIAdvice: '',
      financialProfile: {
        avgMonthlyIncome: 0,
        avgMonthlyExpenses: 0,
        savingsRate: 0,
        topSpendingCategories: []
      }
    });
  }
  
  return memory;
};

module.exports = mongoose.model('UserMemory', userMemorySchema);
