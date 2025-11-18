const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      // Income categories
      'salary', 'freelance', 'investment', 'business', 'other-income',
      // Expense categories
      'food', 'transport', 'shopping', 'bills', 'entertainment', 
      'healthcare', 'education', 'travel', 'other-expense'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    nextDate: Date
  },
  location: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'other'],
    default: 'cash'
  }
}, {
  timestamps: true
});

// Optimized indexes for efficient queries
// Compound index for date range queries (most common)
transactionSchema.index({ user: 1, date: -1, type: 1 });

// Index for category filtering
transactionSchema.index({ user: 1, category: 1, date: -1 });

// Index for monthly aggregations
transactionSchema.index({ user: 1, date: 1 });

// Sparse index for recurring transactions
transactionSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextDate': 1 }, { sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
