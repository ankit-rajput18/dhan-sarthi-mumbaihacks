const mongoose = require('mongoose');

// Monthly aggregated summary for faster queries
const transactionSummarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  // Income summary
  totalIncome: {
    type: Number,
    default: 0
  },
  incomeCount: {
    type: Number,
    default: 0
  },
  incomeByCategory: [{
    category: String,
    amount: Number,
    count: Number
  }],
  // Expense summary
  totalExpense: {
    type: Number,
    default: 0
  },
  expenseCount: {
    type: Number,
    default: 0
  },
  expenseByCategory: [{
    category: String,
    amount: Number,
    count: Number
  }],
  // Net amount
  netAmount: {
    type: Number,
    default: 0
  },
  // Payment method breakdown
  paymentMethods: [{
    method: String,
    amount: Number,
    count: Number
  }],
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique compound index - one summary per user per month
transactionSummarySchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

// Index for date range queries
transactionSummarySchema.index({ user: 1, year: -1, month: -1 });

// Static method to update or create summary for a specific month
transactionSummarySchema.statics.updateMonthlySummary = async function(userId, year, month) {
  const Transaction = mongoose.model('Transaction');
  
  // Get start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  // Aggregate transactions for the month
  const summary = await Transaction.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $facet: {
        income: [
          { $match: { type: 'income' } },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        incomeByCategory: [
          { $match: { type: 'income' } },
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              category: '$_id',
              amount: 1,
              count: 1
            }
          }
        ],
        expense: [
          { $match: { type: 'expense' } },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        expenseByCategory: [
          { $match: { type: 'expense' } },
          {
            $group: {
              _id: '$category',
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              category: '$_id',
              amount: 1,
              count: 1
            }
          }
        ],
        paymentMethods: [
          {
            $group: {
              _id: '$paymentMethod',
              amount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              method: '$_id',
              amount: 1,
              count: 1
            }
          }
        ]
      }
    }
  ]);
  
  const data = summary[0];
  const totalIncome = data.income[0]?.total || 0;
  const totalExpense = data.expense[0]?.total || 0;
  
  // Upsert the summary
  return await this.findOneAndUpdate(
    { user: userId, year, month },
    {
      user: userId,
      year,
      month,
      totalIncome,
      incomeCount: data.income[0]?.count || 0,
      incomeByCategory: data.incomeByCategory || [],
      totalExpense,
      expenseCount: data.expense[0]?.count || 0,
      expenseByCategory: data.expenseByCategory || [],
      netAmount: totalIncome - totalExpense,
      paymentMethods: data.paymentMethods || [],
      lastUpdated: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('TransactionSummary', transactionSummarySchema);
