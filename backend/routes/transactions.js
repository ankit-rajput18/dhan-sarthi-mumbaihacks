const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const Budget = require('../models/Budget');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build filter object
    const filter = { user: userId };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);

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

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction' });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', [
  auth,
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'netbanking', 'wallet', 'other']).withMessage('Invalid payment method'),
  body('recurring.isRecurring').optional().isBoolean().withMessage('Recurring must be boolean'),
  body('recurring.frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid recurring frequency')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      type,
      amount,
      category,
      description,
      date,
      tags,
      location,
      paymentMethod,
      recurring
    } = req.body;

    // Create transaction
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
    await transaction.populate('user', 'name email');

    // Create notification for transaction
    if (type === 'expense') {
      await notificationService.notifyTransactionAdded(req.user._id, amount, category);
      
      // Check budget and create warning if needed
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const budget = await Budget.findOne({
        user: req.user._id,
        month: currentMonth,
        year: currentYear
      });

      if (budget) {
        const categoryBudget = budget.categories.find(c => c.category === category);
        if (categoryBudget) {
          // Calculate total spent in this category this month
          const startOfMonth = new Date(currentYear, currentMonth, 1);
          const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
          
          const totalSpent = await Transaction.aggregate([
            {
              $match: {
                user: req.user._id,
                type: 'expense',
                category: category,
                date: { $gte: startOfMonth, $lte: endOfMonth }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]);

          const spent = totalSpent.length > 0 ? totalSpent[0].total : 0;
          const budgetAmount = categoryBudget.allocated;
          const percentage = Math.round((spent / budgetAmount) * 100);

          // Budget exceeded
          if (spent > budgetAmount) {
            const excess = spent - budgetAmount;
            await notificationService.notifyBudgetExceeded(req.user._id, category, excess, budgetAmount);
          }
          // Budget warning at 80%
          else if (percentage >= 80 && percentage < 100) {
            await notificationService.notifyBudgetWarning(req.user._id, category, percentage, spent, budgetAmount);
          }
        }
      }
    }

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
// @desc    Update transaction
// @access  Private
router.put('/:id', [
  auth,
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().isString().notEmpty().withMessage('Category cannot be empty'),
  body('description').optional().isString().notEmpty().withMessage('Description cannot be empty'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO date'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'netbanking', 'wallet', 'other']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

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
    ).populate('user', 'name email');

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
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction summary statistics
// @access  Private
router.get('/stats/summary', [
  auth,
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = { user: userId };
    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    }

    // Get income and expense totals
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
    const netAmount = totalIncome - totalExpenses;

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netAmount,
        incomeCount: incomeStats[0]?.count || 0,
        expenseCount: expenseStats[0]?.count || 0
      },
      categoryBreakdown: categoryStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;
