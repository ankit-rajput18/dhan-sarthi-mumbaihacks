const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// @route   GET /api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
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

    const { page = 1, limit = 10, status, category, priority } = req.query;
    const userId = req.user._id;

    // Build filter object
    const filter = { user: userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get goals with pagination
    const goals = await Goal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    // Get total count for pagination
    const total = await Goal.countDocuments(filter);

    res.json({
      goals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalGoals: total,
        hasNext: skip + goals.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error while fetching goals' });
  }
});

// @route   GET /api/goals/available-funds
// @desc    Calculate available funds for goal allocation (ALL TIME)
// @access  Private
router.get('/available-funds', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Calculating available funds for user ${userId} (all time)`);
    
    // Import Transaction and Loan models
    const Transaction = require('../models/Transaction');
    const Loan = require('../models/Loan');
    
    // Get ALL transactions (no date filter)
    const transactions = await Transaction.find({
      user: userId
    });
    
    console.log(`Found ${transactions.length} total transactions`);
    
    // Calculate total income (all time)
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate total expenses (all time)
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    console.log(`Total Income: ${totalIncome}, Total Expenses: ${totalExpenses}`);
    
    // Get all active loans and calculate total EMI paid so far
    const loans = await Loan.find({
      user: userId,
      status: 'active'
    }).catch(err => {
      console.log('Loan query error (non-critical):', err.message);
      return [];
    });
    
    // Calculate total EMI payments made (from payment history)
    let totalEMIs = 0;
    (loans || []).forEach(loan => {
      if (loan.paymentHistory && loan.paymentHistory.length > 0) {
        const totalPaid = loan.paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        totalEMIs += totalPaid;
      }
    });
    
    console.log(`Total EMIs paid: ${totalEMIs}`);
    
    // Get all goals and calculate total allocated (all time)
    const goals = await Goal.find({
      user: userId,
      status: 'active'
    });
    
    console.log(`Found ${goals.length} active goals`);
    
    let totalAllocated = 0;
    goals.forEach(goal => {
      if (goal.contributions && goal.contributions.length > 0) {
        const goalTotal = goal.contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        totalAllocated += goalTotal;
      }
    });
    
    console.log(`Total allocated to goals: ${totalAllocated}`);
    
    // Calculate available funds (all time balance)
    const availableFunds = Math.max(0, totalIncome - totalExpenses - totalEMIs - totalAllocated);
    
    console.log(`Available funds: ${availableFunds}`);
    
    res.json({
      totalIncome,
      totalExpenses,
      totalEMIs,
      totalAllocated,
      availableFunds,
      breakdown: {
        income: totalIncome,
        expenses: totalExpenses,
        emis: totalEMIs,
        allocated: totalAllocated,
        available: availableFunds
      }
    });
    
  } catch (error) {
    console.error('❌ Calculate available funds error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while calculating available funds',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ goal });

  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Server error while fetching goal' });
  }
});

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', [
  auth,
  body('name').isString().notEmpty().withMessage('Goal name is required'),
  body('targetAmount').isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),
  body('currentAmount').optional().isFloat({ min: 0 }).withMessage('Current amount must be positive'),
  body('deadline').isISO8601().withMessage('Deadline must be a valid date'),
  body('category').isIn(['vehicle', 'home', 'travel', 'education', 'health', 'technology', 'luxury', 'hobby', 'business', 'emergency']).withMessage('Invalid category'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
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
      name,
      targetAmount,
      currentAmount,
      deadline,
      category,
      description,
      priority,
      tags
    } = req.body;

    // Create goal
    const goal = new Goal({
      user: req.user._id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: new Date(deadline),
      category,
      description,
      priority: priority || 'medium',
      tags: tags || []
    });

    await goal.save();
    await goal.populate('user', 'name email');

    res.status(201).json({
      message: 'Goal created successfully',
      goal
    });

  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Server error while creating goal' });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().isString().notEmpty().withMessage('Goal name cannot be empty'),
  body('targetAmount').optional().isFloat({ min: 0 }).withMessage('Target amount must be positive'),
  body('currentAmount').optional().isFloat({ min: 0 }).withMessage('Current amount must be positive'),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
  body('category').optional().isIn(['vehicle', 'home', 'travel', 'education', 'health', 'technology', 'luxury', 'hobby', 'business', 'emergency']).withMessage('Invalid category'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
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

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Store old values for comparison
    const oldCurrentAmount = goal.currentAmount;
    const oldProgress = goal.progressPercentage;

    // Update fields
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.targetAmount !== undefined) updateData.targetAmount = req.body.targetAmount;
    if (req.body.currentAmount !== undefined) updateData.currentAmount = req.body.currentAmount;
    if (req.body.deadline) updateData.deadline = new Date(req.body.deadline);
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.priority) updateData.priority = req.body.priority;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.tags) updateData.tags = req.body.tags;

    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    // Check for milestone notifications
    if (req.body.currentAmount !== undefined && req.body.currentAmount > oldCurrentAmount) {
      const newProgress = updatedGoal.progressPercentage;
      const milestones = [25, 50, 75, 90, 100];
      const lastNotified = updatedGoal.lastNotifiedMilestone || 0;

      for (const milestone of milestones) {
        if (newProgress >= milestone && lastNotified < milestone) {
          if (milestone === 100) {
            await notificationService.notifyGoalAchieved(
              req.user._id,
              updatedGoal.name,
              updatedGoal.targetAmount
            );
          } else {
            await notificationService.notifyGoalProgress(
              req.user._id,
              updatedGoal.name,
              milestone,
              updatedGoal.currentAmount,
              updatedGoal.targetAmount
            );
          }
          
          // Update milestone
          updatedGoal.lastNotifiedMilestone = milestone;
          await updatedGoal.save();
          break;
        }
      }
    }

    res.json({
      message: 'Goal updated successfully',
      goal: updatedGoal
    });

  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error while updating goal' });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });

  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Server error while deleting goal' });
  }
});

// @route   PUT /api/goals/:id/amount
// @desc    Update current amount for a goal
// @access  Private
router.put('/:id/amount', [
  auth,
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
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

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { amount } = req.body;
    
    // Update current amount
    await goal.updateCurrentAmount(amount);

    await goal.populate('user', 'name email');

    res.json({
      message: 'Goal amount updated successfully',
      goal
    });

  } catch (error) {
    console.error('Update goal amount error:', error);
    res.status(500).json({ message: 'Server error while updating goal amount' });
  }
});

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to a goal
// @access  Private
router.post('/:id/contribute', [
  auth,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').optional().isISO8601().withMessage('Date must be valid'),
  body('note').optional().isString().withMessage('Note must be a string')
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

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { amount, date, note } = req.body;
    const oldProgress = goal.progressPercentage;

    // Add contribution
    await goal.addContribution(
      amount,
      date ? new Date(date) : new Date(),
      note || ''
    );

    await goal.populate('user', 'name email');

    // Check for milestone notifications
    const newProgress = goal.progressPercentage;
    const milestones = [25, 50, 75, 90, 100];
    const lastNotified = goal.lastNotifiedMilestone || 0;

    for (const milestone of milestones) {
      if (newProgress >= milestone && lastNotified < milestone) {
        if (milestone === 100) {
          await notificationService.notifyGoalAchieved(
            req.user._id,
            goal.name,
            goal.targetAmount
          );
        } else {
          await notificationService.notifyGoalProgress(
            req.user._id,
            goal.name,
            milestone,
            goal.currentAmount,
            goal.targetAmount
          );
        }
        
        // Update milestone
        goal.lastNotifiedMilestone = milestone;
        await goal.save();
        break;
      }
    }

    res.json({
      message: 'Contribution added successfully',
      goal,
      contribution: {
        amount,
        date: date || new Date(),
        note: note || ''
      }
    });

  } catch (error) {
    console.error('Add contribution error:', error);
    res.status(500).json({ message: 'Server error while adding contribution' });
  }
});

// @route   GET /api/goals/stats/summary
// @desc    Get goal summary statistics
// @access  Private
router.get('/stats/summary', [
  auth,
  query('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user._id;

    // Build filter object
    const filter = { user: userId };
    if (status) filter.status = status;

    // Get goal statistics
    const [goalStats, categoryStats, priorityStats] = await Promise.all([
      Goal.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          totalGoals: { $sum: 1 },
          totalTargetAmount: { $sum: '$targetAmount' },
          totalCurrentAmount: { $sum: '$currentAmount' },
          avgProgress: { $avg: '$progressPercentage' }
        }}
      ]),
      Goal.aggregate([
        { $match: filter },
        { $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalTargetAmount: { $sum: '$targetAmount' },
          totalCurrentAmount: { $sum: '$currentAmount' }
        }},
        { $sort: { totalTargetAmount: -1 } }
      ]),
      Goal.aggregate([
        { $match: filter },
        { $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalTargetAmount: { $sum: '$targetAmount' },
          totalCurrentAmount: { $sum: '$currentAmount' }
        }}
      ])
    ]);

    const stats = goalStats[0] || {
      totalGoals: 0,
      totalTargetAmount: 0,
      totalCurrentAmount: 0,
      avgProgress: 0
    };

    res.json({
      summary: {
        totalGoals: stats.totalGoals,
        totalTargetAmount: stats.totalTargetAmount,
        totalCurrentAmount: stats.totalCurrentAmount,
        avgProgress: Math.round(stats.avgProgress * 100) / 100,
        totalRemainingAmount: stats.totalTargetAmount - stats.totalCurrentAmount
      },
      categoryBreakdown: categoryStats,
      priorityBreakdown: priorityStats
    });

  } catch (error) {
    console.error('Get goal stats error:', error);
    res.status(500).json({ message: 'Server error while fetching goal statistics' });
  }
});

module.exports = router;