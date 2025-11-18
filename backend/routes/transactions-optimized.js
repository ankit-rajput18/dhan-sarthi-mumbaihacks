const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const TransactionSummary = require('../models/TransactionSummary');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to update monthly summary after transaction changes
async function updateMonthlySummary(userId, date) {
  const transactionDate = new Date(date);
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth() + 1;
  
  try {
    await TransactionSummary.updateMonthlySummary(userId, year, month);
  } catch (error) {
    console.error('Error updating monthly summary:', error);
  }
}

// @route   GET /api/transactions
// @desc    Get transactions with optimized pagination
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense']),
  query('category').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 50, type, category, startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build optimized filter
    const filter = { user: userId };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Use lean() for faster queries (returns plain JS objects)
    // Select only needed fields to reduce data transfer
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .select('-__v -updatedAt')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTransactions: total,
        hasNext: skip + transactions.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

// @route   GET /api/transactions/monthly/:year/:month
// @desc    Get transactions for a specific month (optimized)
// @access  Private
router.get('/monthly/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user._id;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    })
    .select('-__v -updatedAt')
    .sort({ date: -1 })
    .lean();

    res.json({ transactions, count: transactions.length });

  } catch (error) {
    console.error('Get monthly transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching monthly transactions' });
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction summary (uses cached monthly summaries when possible)
// @access  Private
router.get('/stats/summary', [
  auth,
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('useCache').optional().isBoolean()
], async (req, res) => {
  try {
    const { startDate, endDate, useCache = 'true' } = req.query;
    const userId = req.user._id;

    // If requesting current month and cache is enabled, try to use cached summary
    if (useCache === 'true' && !startDate && !endDate) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const cachedSummary = await TransactionSummary.findOne({
        user: userId,
        year: currentYear,
        month: currentMonth
      }).lean();

      if (cachedSummary) {
        return res.json({
          summary: {
            totalIncome: cachedSummary.totalIncome,
            totalExpenses: cachedSummary.totalExpense,
            netAmount: cachedSummary.netAmount,
            incomeCount: cachedSummary.incomeCount,
            expenseCount: cachedSummary.expenseCount
          },
          categoryBreakdown: [
            ...cachedSummary.incomeByCategory,
            ...cachedSummary.expenseByCategory
          ],
          paymentMethods: cachedSummary.paymentMethods,
          cached: true,
          lastUpdated: cachedSummary.lastUpdated
        });
      }
    }

    // Fall back to real-time aggregation
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = { user: userId };
    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    }

    const [incomeStats, expenseStats, categoryStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...filter, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...filter, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: filter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ])
    ]);

    const totalIncome = incomeStats[0]?.total || 0;
    const totalExpenses = expenseStats[0]?.total || 0;

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        incomeCount: incomeStats[0]?.count || 0,
        expenseCount: expenseStats[0]?.count || 0
      },
      categoryBreakdown: categoryStats,
      cached: false
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// @route   GET /api/transactions/stats/monthly-summary/:year/:month
// @desc    Get or generate monthly summary
// @access  Private
router.get('/stats/monthly-summary/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user._id;

    // Try to get cached summary
    let summary = await TransactionSummary.findOne({
      user: userId,
      year: parseInt(year),
      month: parseInt(month)
    }).lean();

    // If not found or outdated (older than 1 hour), regenerate
    if (!summary || (Date.now() - new Date(summary.lastUpdated).getTime() > 3600000)) {
      summary = await TransactionSummary.updateMonthlySummary(
        userId,
        parseInt(year),
        parseInt(month)
      );
    }

    res.json({ summary });

  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ message: 'Server error while fetching monthly summary' });
  }
});

// @route   GET /api/transactions/stats/yearly/:year
// @desc    Get yearly summary (aggregates monthly summaries)
// @access  Private
router.get('/stats/yearly/:year', auth, async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.user._id;

    // Get all monthly summaries for the year
    const monthlySummaries = await TransactionSummary.find({
      user: userId,
      year: parseInt(year)
    })
    .sort({ month: 1 })
    .lean();

    // Aggregate yearly totals
    const yearlyTotal = monthlySummaries.reduce((acc, month) => {
      acc.totalIncome += month.totalIncome;
      acc.totalExpense += month.totalExpense;
      acc.incomeCount += month.incomeCount;
      acc.expenseCount += month.expenseCount;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0 });

    yearlyTotal.netAmount = yearlyTotal.totalIncome - yearlyTotal.totalExpense;

    res.json({
      year: parseInt(year),
      summary: yearlyTotal,
      monthlyBreakdown: monthlySummaries
    });

  } catch (error) {
    console.error('Get yearly summary error:', error);
    res.status(500).json({ message: 'Server error while fetching yearly summary' });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction (with auto-summary update)
// @access  Private
router.post('/', [
  auth,
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ min: 0 }),
  body('category').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('date').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('location').optional().isString(),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'netbanking', 'wallet', 'other']),
  body('recurring.isRecurring').optional().isBoolean(),
  body('recurring.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      type, amount, category, description, date,
      tags, location, paymentMethod, recurring
    } = req.body;

    const transaction = new Transaction({
      user: req.user._id,
      type,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      tags: tags || [],
      location,
      paymentMethod: paymentMethod || 'cash',
      recurring: recurring || { isRecurring: false }
    });

    await transaction.save();

    // Update monthly summary asynchronously
    updateMonthlySummary(req.user._id, transaction.date);

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction (with auto-summary update)
// @access  Private
router.put('/:id', [
  auth,
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ min: 0 }),
  body('category').optional().isString().notEmpty(),
  body('description').optional().isString().notEmpty(),
  body('date').optional().isISO8601(),
  body('tags').optional().isArray(),
  body('location').optional().isString(),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'netbanking', 'wallet', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const oldTransaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const oldDate = oldTransaction.date;

    // Update fields
    const updateData = {};
    if (req.body.type) updateData.type = req.body.type;
    if (req.body.amount !== undefined) updateData.amount = req.body.amount;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.date) updateData.date = new Date(req.body.date);
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.paymentMethod) updateData.paymentMethod = req.body.paymentMethod;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update monthly summaries for both old and new dates
    updateMonthlySummary(req.user._id, oldDate);
    if (updateData.date) {
      updateMonthlySummary(req.user._id, updateData.date);
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction (with auto-summary update)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transactionDate = transaction.date;
    await transaction.deleteOne();

    // Update monthly summary
    updateMonthlySummary(req.user._id, transactionDate);

    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
});

// @route   POST /api/transactions/bulk
// @desc    Bulk insert transactions (optimized)
// @access  Private
router.post('/bulk', [
  auth,
  body('transactions').isArray({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { transactions } = req.body;
    const userId = req.user._id;

    // Prepare bulk insert
    const transactionsToInsert = transactions.map(t => ({
      user: userId,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date ? new Date(t.date) : new Date(),
      tags: t.tags || [],
      location: t.location,
      paymentMethod: t.paymentMethod || 'cash',
      recurring: t.recurring || { isRecurring: false }
    }));

    const inserted = await Transaction.insertMany(transactionsToInsert, { ordered: false });

    // Update monthly summaries for affected months
    const affectedMonths = new Set();
    inserted.forEach(t => {
      const date = new Date(t.date);
      affectedMonths.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    });

    affectedMonths.forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      updateMonthlySummary(userId, new Date(year, month - 1, 1));
    });

    res.status(201).json({
      message: `${inserted.length} transactions created successfully`,
      count: inserted.length
    });

  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ message: 'Server error while creating transactions' });
  }
});

module.exports = router;
