const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Loan = require('../models/Loan');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   GET /api/loan/analyze
// @desc    Get loan analysis with EMI, risk, and progress
// @access  Private
router.get('/analyze', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const userIncome = user.income || 0;

    // Get all active loans
    const loans = await Loan.find({ user: userId, status: 'active' });

    // Calculate risk for each loan
    const loanAnalysis = loans.map(loan => {
      // Calculate risk level
      const riskLevel = loan.calculateLoanRisk(userIncome);
      
      // Calculate EMI progress
      const totalEmis = loan.tenureMonths;
      const paidEmis = loan.emiSchedule.filter(e => e.status === 'paid').length;
      const emiProgress = totalEmis > 0 ? ((paidEmis / totalEmis) * 100).toFixed(1) : 0;

      // Find next payment
      const nextEmi = loan.emiSchedule.find(e => e.status === 'pending');
      const nextPaymentDate = nextEmi ? nextEmi.dueDate : null;
      const nextPaymentAmount = nextEmi ? nextEmi.emiAmount : 0;

      return {
        loanId: loan._id,
        loanName: loan.loanName,
        loanType: loan.loanType,
        emiAmount: loan.emiAmount,
        interestRate: loan.interestRate,
        tenureMonths: loan.tenureMonths,
        riskLevel: riskLevel,
        remainingBalance: loan.remainingBalance,
        totalPaid: loan.totalPaid,
        principalAmount: loan.principalAmount,
        emiProgress: parseFloat(emiProgress),
        paidEmis: paidEmis,
        totalEmis: totalEmis,
        nextPaymentDate: nextPaymentDate,
        nextPaymentAmount: nextPaymentAmount,
        lender: loan.lender,
        status: loan.status
      };
    });

    // Calculate overall summary
    const totalEmi = loanAnalysis.reduce((sum, l) => sum + l.emiAmount, 0);
    const totalRemaining = loanAnalysis.reduce((sum, l) => sum + l.remainingBalance, 0);
    const highRiskLoans = loanAnalysis.filter(l => l.riskLevel === 'High Risk').length;
    const moderateRiskLoans = loanAnalysis.filter(l => l.riskLevel === 'Moderate Risk').length;

    res.json({
      success: true,
      loans: loanAnalysis,
      summary: {
        totalLoans: loanAnalysis.length,
        totalMonthlyEmi: totalEmi,
        totalRemainingBalance: totalRemaining,
        highRiskLoans: highRiskLoans,
        moderateRiskLoans: moderateRiskLoans,
        emiToIncomeRatio: userIncome > 0 ? ((totalEmi / userIncome) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Loan analyze error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while analyzing loans',
      error: error.message 
    });
  }
});

// @route   GET /api/loan/ai-explain/:id
// @desc    Get AI explanation for a specific loan
// @access  Private
router.get('/ai-explain/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const loanId = req.params.id;

    // Get loan details
    const loan = await Loan.findOne({ _id: loanId, user: userId });
    if (!loan) {
      return res.status(404).json({ 
        success: false,
        message: 'Loan not found' 
      });
    }

    // Get user income
    const user = await User.findById(userId);
    const userIncome = user.income || 0;

    // Calculate risk
    const riskLevel = loan.calculateLoanRisk(userIncome);

    // Calculate progress
    const totalEmis = loan.tenureMonths;
    const paidEmis = loan.emiSchedule.filter(e => e.status === 'paid').length;
    const emiProgress = totalEmis > 0 ? ((paidEmis / totalEmis) * 100).toFixed(1) : 0;

    // Create AI prompt
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    });

    const emiToIncomeRatio = userIncome > 0 ? ((loan.emiAmount / userIncome) * 100).toFixed(1) : 0;

    const prompt = `You are DhanSarthi, an AI financial advisor. Explain this loan in simple, friendly language:

Loan Details:
- Type: ${loan.loanType} loan
- Name: ${loan.loanName}
- Principal: ₹${loan.principalAmount.toLocaleString()}
- EMI: ₹${loan.emiAmount.toLocaleString()}/month
- Interest Rate: ${loan.interestRate}%
- Tenure: ${loan.tenureMonths} months
- Remaining Balance: ₹${loan.remainingBalance.toLocaleString()}
- Progress: ${emiProgress}% complete (${paidEmis}/${totalEmis} EMIs paid)
- Risk Level: ${riskLevel}
- User's Monthly Income: ₹${userIncome.toLocaleString()}
- EMI to Income Ratio: ${emiToIncomeRatio}%

Provide a 2-3 sentence explanation covering:
1. Why this loan has the "${riskLevel}" classification
2. One specific tip to manage this loan better
3. Whether the EMI burden is manageable

Use Indian Rupees (₹) and keep it conversational.`;

    const result = await model.generateContent(prompt);
    const aiExplanation = result.response.text();

    res.json({
      success: true,
      loanId: loan._id,
      loanName: loan.loanName,
      riskLevel: riskLevel,
      explanation: aiExplanation,
      loanDetails: {
        emiAmount: loan.emiAmount,
        interestRate: loan.interestRate,
        remainingBalance: loan.remainingBalance,
        emiProgress: parseFloat(emiProgress),
        emiToIncomeRatio: parseFloat(emiToIncomeRatio)
      }
    });

  } catch (error) {
    console.error('AI explain loan error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate AI explanation',
      error: error.message 
    });
  }
});

// @route   GET /api/loans
// @desc    Get all loans for a user
// @access  Private
router.get('/', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'completed', 'defaulted', 'prepaid']).withMessage('Invalid status'),
  query('loanType').optional().isString().withMessage('Loan type must be a string')
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

    const { page = 1, limit = 10, status, loanType } = req.query;
    const userId = req.user._id;

    console.log('GET /loans - User ID:', userId);
    console.log('GET /loans - User email:', req.user.email);

    // Build filter object
    const filter = { user: userId };
    if (status) filter.status = status;
    if (loanType) filter.loanType = loanType;

    console.log('GET /loans - Filter:', filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get loans with pagination
    const loans = await Loan.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    // Get total count for pagination
    const total = await Loan.countDocuments(filter);

    console.log('GET /loans - Found loans:', loans.length);
    console.log('GET /loans - Total count:', total);

    res.json({
      loans,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalLoans: total,
        hasNext: skip + loans.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Server error while fetching loans' });
  }
});

// IMPORTANT: All specific routes must come BEFORE /:id route to avoid conflicts

// @route   POST /api/loans/calculate-emi
// @desc    Calculate EMI for given parameters
// @access  Private
router.post('/calculate-emi', [
  auth,
  body('principalAmount').isFloat({ min: 0 }).withMessage('Principal amount must be positive'),
  body('interestRate').isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
  body('tenureMonths').isInt({ min: 1, max: 600 }).withMessage('Tenure must be between 1 and 600 months')
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

    const { principalAmount, interestRate, tenureMonths } = req.body;

    // Calculate EMI
    const monthlyRate = interestRate / (12 * 100);
    let emiAmount;
    
    if (monthlyRate === 0) {
      emiAmount = principalAmount / tenureMonths;
    } else {
      emiAmount = (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                  (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    }

    const totalAmount = emiAmount * tenureMonths;
    const totalInterest = totalAmount - principalAmount;

    res.json({
      principalAmount,
      interestRate,
      tenureMonths,
      emiAmount: Math.round(emiAmount),
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest)
    });

  } catch (error) {
    console.error('Calculate EMI error:', error);
    res.status(500).json({ message: 'Server error while calculating EMI' });
  }
});

// @route   GET /api/loans/stats/summary
// @desc    Get loan summary statistics
// @access  Private
router.get('/stats/summary', [
  auth,
  query('status').optional().isIn(['active', 'completed', 'defaulted', 'prepaid']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user._id;

    // Build filter object
    const filter = { user: userId };
    if (status) filter.status = status;

    // Get loan statistics
    const [loanStats, typeStats, statusStats] = await Promise.all([
      Loan.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalPrincipal: { $sum: '$principalAmount' },
          totalRemaining: { $sum: '$remainingBalance' },
          totalPaid: { $sum: '$totalPaid' },
          totalInterest: { $sum: '$totalInterest' },
          avgInterestRate: { $avg: '$interestRate' }
        }}
      ]),
      Loan.aggregate([
        { $match: filter },
        { $group: {
          _id: '$loanType',
          count: { $sum: 1 },
          totalPrincipal: { $sum: '$principalAmount' },
          totalRemaining: { $sum: '$remainingBalance' }
        }},
        { $sort: { totalPrincipal: -1 } }
      ]),
      Loan.aggregate([
        { $match: filter },
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPrincipal: { $sum: '$principalAmount' },
          totalRemaining: { $sum: '$remainingBalance' }
        }}
      ])
    ]);

    const stats = loanStats[0] || {
      totalLoans: 0,
      totalPrincipal: 0,
      totalRemaining: 0,
      totalPaid: 0,
      totalInterest: 0,
      avgInterestRate: 0
    };

    res.json({
      summary: {
        totalLoans: stats.totalLoans,
        totalPrincipal: stats.totalPrincipal,
        totalRemaining: stats.totalRemaining,
        totalPaid: stats.totalPaid,
        totalInterest: stats.totalInterest,
        avgInterestRate: Math.round(stats.avgInterestRate * 100) / 100
      },
      typeBreakdown: typeStats,
      statusBreakdown: statusStats
    });

  } catch (error) {
    console.error('Get loan stats error:', error);
    res.status(500).json({ message: 'Server error while fetching loan statistics' });
  }
});

// @route   GET /api/loans/upcoming-emis
// @desc    Get upcoming EMIs for all active loans
// @access  Private
router.get('/upcoming-emis', [
  auth,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { days = 30 } = req.query;
    const userId = req.user._id;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const loans = await Loan.find({
      user: userId,
      status: 'active',
      nextEmiDate: { $exists: true, $lte: futureDate }
    }).sort({ nextEmiDate: 1 });

    const upcomingEmis = loans.map(loan => {
      const nextEmiDate = loan.nextEmiDate ? new Date(loan.nextEmiDate) : null;
      const daysUntilDue = nextEmiDate ? Math.ceil((nextEmiDate - today) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        loanId: loan._id,
        loanName: loan.loanName || 'Unnamed Loan',
        loanType: loan.loanType,
        lender: loan.lender,
        nextEmiDate: nextEmiDate,
        nextEmiAmount: loan.nextEmiAmount || 0,
        daysUntilDue: daysUntilDue,
        remainingBalance: loan.remainingBalance || 0
      };
    });

    res.json({
      upcomingEmis,
      totalAmount: upcomingEmis.reduce((sum, emi) => sum + (emi.nextEmiAmount || 0), 0)
    });

  } catch (error) {
    console.error('Get upcoming EMIs error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while fetching upcoming EMIs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/loans/:id
// @desc    Get single loan
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({ loan });

  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ message: 'Server error while fetching loan' });
  }
});

// @route   POST /api/loans
// @desc    Create new loan
// @access  Private
router.post('/', [
  auth,
  body('loanType').isIn(['personal', 'home', 'car', 'education', 'business', 'gold', 'other']).withMessage('Invalid loan type'),
  body('loanName').isString().notEmpty().withMessage('Loan name is required'),
  body('principalAmount').isFloat({ min: 0 }).withMessage('Principal amount must be a positive number'),
  body('interestRate').isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
  body('tenureMonths').isInt({ min: 1, max: 600 }).withMessage('Tenure must be between 1 and 600 months'),
  body('lender').isString().notEmpty().withMessage('Lender information is required'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  body('installmentDueDay').optional().isInt({ min: 1, max: 28 }).withMessage('Installment due day must be between 1 and 28'),
  body('loanAccountNumber').optional().isString().withMessage('Account number must be a string'),
  body('paymentFrequency').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid payment frequency'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('prepaymentAllowed').optional().isBoolean().withMessage('Prepayment allowed must be boolean'),
  body('prepaymentCharges').optional().isFloat({ min: 0 }).withMessage('Prepayment charges must be positive'),
  body('insuranceAmount').optional().isFloat({ min: 0 }).withMessage('Insurance amount must be positive'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be positive'),
  body('otherCharges').optional().isFloat({ min: 0 }).withMessage('Other charges must be positive')
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
      loanType,
      loanName,
      principalAmount,
      interestRate,
      tenureMonths,
      lender,
      startDate,
      installmentDueDay,
      loanAccountNumber,
      paymentFrequency,
      description,
      tags,
      prepaymentAllowed,
      prepaymentCharges,
      insuranceAmount,
      processingFee,
      otherCharges
    } = req.body;

    // Get user income for risk calculation
    const user = await User.findById(req.user._id);
    const userIncome = user.income || 0;

    // Create loan
    const loan = new Loan({
      user: req.user._id,
      loanType,
      loanName,
      principalAmount,
      interestRate,
      tenureMonths,
      lender,
      startDate: startDate ? new Date(startDate) : new Date(),
      installmentDueDay: installmentDueDay || new Date(startDate ? startDate : new Date()).getDate(),
      loanAccountNumber,
      paymentFrequency: paymentFrequency || 'monthly',
      description,
      tags: tags || [],
      prepaymentAllowed: prepaymentAllowed !== undefined ? prepaymentAllowed : true,
      prepaymentCharges: prepaymentCharges || 0,
      insuranceAmount: insuranceAmount || 0,
      processingFee: processingFee || 0,
      otherCharges: otherCharges || 0
    });

    await loan.save();
    
    // Calculate and update risk level
    loan.riskLevel = loan.calculateLoanRisk(userIncome);
    await loan.save();
    
    await loan.populate('user', 'name email');

    res.status(201).json({
      message: 'Loan created successfully',
      loan
    });

  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ message: 'Server error while creating loan' });
  }
});

// @route   PUT /api/loans/:id
// @desc    Update loan
// @access  Private
router.put('/:id', [
  auth,
  body('loanType').optional().isIn(['personal', 'home', 'car', 'education', 'business', 'gold', 'other']).withMessage('Invalid loan type'),
  body('loanName').optional().isString().notEmpty().withMessage('Loan name cannot be empty'),
  body('principalAmount').optional().isFloat({ min: 0 }).withMessage('Principal amount must be positive'),
  body('interestRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
  body('tenureMonths').optional().isInt({ min: 1, max: 600 }).withMessage('Tenure must be between 1 and 600 months'),
  body('lender').optional().isString().notEmpty().withMessage('Lender cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  body('installmentDueDay').optional().isInt({ min: 1, max: 28 }).withMessage('Installment due day must be between 1 and 28'),
  body('loanAccountNumber').optional().isString().withMessage('Account number must be a string'),
  body('paymentFrequency').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Invalid payment frequency'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('prepaymentAllowed').optional().isBoolean().withMessage('Prepayment allowed must be boolean'),
  body('prepaymentCharges').optional().isFloat({ min: 0 }).withMessage('Prepayment charges must be positive'),
  body('insuranceAmount').optional().isFloat({ min: 0 }).withMessage('Insurance amount must be positive'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be positive'),
  body('otherCharges').optional().isFloat({ min: 0 }).withMessage('Other charges must be positive')
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

    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Update fields
    const updateData = {};
    if (req.body.loanType) updateData.loanType = req.body.loanType;
    if (req.body.loanName) updateData.loanName = req.body.loanName;
    if (req.body.principalAmount !== undefined) updateData.principalAmount = req.body.principalAmount;
    if (req.body.interestRate !== undefined) updateData.interestRate = req.body.interestRate;
    if (req.body.tenureMonths !== undefined) updateData.tenureMonths = req.body.tenureMonths;
    if (req.body.lender) updateData.lender = req.body.lender;
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.installmentDueDay !== undefined) updateData.installmentDueDay = req.body.installmentDueDay;
    if (req.body.loanAccountNumber !== undefined) updateData.loanAccountNumber = req.body.loanAccountNumber;
    if (req.body.paymentFrequency) updateData.paymentFrequency = req.body.paymentFrequency;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.prepaymentAllowed !== undefined) updateData.prepaymentAllowed = req.body.prepaymentAllowed;
    if (req.body.prepaymentCharges !== undefined) updateData.prepaymentCharges = req.body.prepaymentCharges;
    if (req.body.insuranceAmount !== undefined) updateData.insuranceAmount = req.body.insuranceAmount;
    if (req.body.processingFee !== undefined) updateData.processingFee = req.body.processingFee;
    if (req.body.otherCharges !== undefined) updateData.otherCharges = req.body.otherCharges;

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      message: 'Loan updated successfully',
      loan: updatedLoan
    });

  } catch (error) {
    console.error('Update loan error:', error);
    res.status(500).json({ message: 'Server error while updating loan' });
  }
});

// @route   DELETE /api/loans/:id
// @desc    Delete loan
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({ message: 'Loan deleted successfully' });

  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ message: 'Server error while deleting loan' });
  }
});

// @route   POST /api/loans/:id/payments
// @desc    Record loan payment
// @access  Private
router.post('/:id/payments', [
  auth,
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be positive'),
  body('emiNumber').optional().isInt({ min: 1 }).withMessage('EMI number must be positive'),
  body('paymentDate').optional().isISO8601().withMessage('Payment date must be valid ISO date'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'upi', 'netbanking', 'cheque', 'auto-debit']).withMessage('Invalid payment method'),
  body('notes').optional().isString().isLength({ min: 0 }).withMessage('Notes must be a string'),
  body('lateFee').optional().isFloat({ min: 0 }).withMessage('Late fee must be positive')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Payment validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const {
      amount,
      emiNumber: providedEmiNumber,
      paymentDate,
      paymentMethod,
      notes,
      lateFee
    } = req.body;

    // Auto-calculate EMI number if not provided
    let emiNumber = providedEmiNumber;
    if (!emiNumber) {
      // Find the next unpaid EMI
      const nextUnpaidEmi = loan.emiSchedule.find(e => e.status === 'pending' || e.status === 'overdue');
      if (!nextUnpaidEmi) {
        return res.status(400).json({ message: 'No pending EMIs found for this loan' });
      }
      emiNumber = nextUnpaidEmi.emiNumber;
    }

    // Find the EMI in the schedule
    const emi = loan.emiSchedule.find(e => e.emiNumber === emiNumber);
    if (!emi) {
      return res.status(404).json({ message: 'EMI not found' });
    }

    // Check if EMI is already paid
    if (emi.status === 'paid') {
      return res.status(400).json({ message: `EMI #${emiNumber} is already paid` });
    }

    // Calculate principal and interest portions
    const interestPaid = emi.interestAmount;
    const principalPaid = amount - interestPaid - (lateFee || 0);

    // Create payment record
    const payment = {
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      amount,
      emiNumber,
      principalPaid,
      interestPaid,
      lateFee: lateFee || 0,
      paymentMethod: paymentMethod || 'cash',
      notes
    };

    // Update loan
    loan.payments.push(payment);
    loan.totalPaid += amount;
    loan.principalPaid += principalPaid;
    loan.interestPaid += interestPaid;
    loan.remainingBalance = Math.max(0, loan.remainingBalance - principalPaid);

    // Update EMI status
    emi.status = 'paid';
    emi.paidDate = payment.paymentDate;
    emi.paidAmount = amount;
    emi.lateFee = lateFee || 0;

    // Update next EMI
    const nextUnpaidEmi = loan.emiSchedule.find(e => e.status === 'pending');
    if (nextUnpaidEmi) {
      loan.nextEmiDate = nextUnpaidEmi.dueDate;
      loan.nextEmiAmount = nextUnpaidEmi.emiAmount;
    } else {
      loan.status = 'completed';
    }

    // Update loan status
    loan.updateLoanStatus();

    await loan.save();
    await loan.populate('user', 'name email');

    res.json({
      message: 'Payment recorded successfully',
      loan,
      payment
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error while recording payment' });
  }
});

// @route   GET /api/loans/:id/emi-schedule
// @desc    Get EMI schedule for a loan
// @access  Private
router.get('/:id/emi-schedule', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({
      loanId: loan._id,
      loanName: loan.loanName,
      emiSchedule: loan.emiSchedule
    });

  } catch (error) {
    console.error('Get EMI schedule error:', error);
    res.status(500).json({ message: 'Server error while fetching EMI schedule' });
  }
});

// @route   GET /api/loans/:id/payments
// @desc    Get payment history for a loan
// @access  Private
router.get('/:id/payments', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({
      loanId: loan._id,
      loanName: loan.loanName,
      payments: loan.payments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// @route   GET /api/loans/:id/installments
// @desc    Get installment summary and details
// @access  Private
router.get('/:id/installments', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Update loan status to refresh EMI statuses
    loan.updateLoanStatus();
    await loan.save();

    const summary = loan.getInstallmentSummary();
    const upcomingDueDates = loan.getUpcomingDueDates(3);

    res.json({
      loanId: loan._id,
      loanName: loan.loanName,
      summary,
      upcomingDueDates,
      emiSchedule: loan.emiSchedule
    });

  } catch (error) {
    console.error('Get installments error:', error);
    res.status(500).json({ message: 'Server error while fetching installments' });
  }
});

// @route   GET /api/loans/alerts/due-dates
// @desc    Get due date alerts for all loans
// @access  Private
router.get('/alerts/due-dates', [
  auth,
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { days = 7 } = req.query;
    const userId = req.user._id;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const loans = await Loan.find({
      user: userId,
      status: { $in: ['active', 'defaulted'] }
    });

    const alerts = [];

    for (const loan of loans) {
      loan.updateLoanStatus();
      await loan.save();

      const upcomingDueDates = loan.getUpcomingDueDates(Math.ceil(parseInt(days) / 30));
      
      upcomingDueDates.forEach(emi => {
        const daysUntil = emi.daysUntilDue;
        let alertType = 'info';
        let message = '';

        if (emi.status === 'overdue') {
          alertType = 'critical';
          message = `Overdue by ${emi.daysOverdue} days! Pay ₹${emi.amount.toLocaleString()} immediately to avoid penalties.`;
        } else if (daysUntil <= 3) {
          alertType = 'urgent';
          message = `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}! Pay ₹${emi.amount.toLocaleString()} by ${new Date(emi.dueDate).toLocaleDateString()}.`;
        } else if (daysUntil <= 7) {
          alertType = 'warning';
          message = `Due in ${daysUntil} days. Pay ₹${emi.amount.toLocaleString()} by ${new Date(emi.dueDate).toLocaleDateString()}.`;
        } else {
          alertType = 'info';
          message = `Upcoming payment of ₹${emi.amount.toLocaleString()} on ${new Date(emi.dueDate).toLocaleDateString()}.`;
        }

        alerts.push({
          loanId: loan._id,
          loanName: loan.loanName,
          loanType: loan.loanType,
          emiNumber: emi.emiNumber,
          dueDate: emi.dueDate,
          dueDateDay: emi.dueDateDay,
          amount: emi.amount,
          status: emi.status,
          daysUntilDue: daysUntil,
          daysOverdue: emi.daysOverdue,
          alertType,
          message
        });
      });
    }

    // Sort by urgency and date
    alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, urgent: 1, warning: 2, info: 3 };
      if (urgencyOrder[a.alertType] !== urgencyOrder[b.alertType]) {
        return urgencyOrder[a.alertType] - urgencyOrder[b.alertType];
      }
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    res.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.alertType === 'critical').length,
        urgent: alerts.filter(a => a.alertType === 'urgent').length,
        warning: alerts.filter(a => a.alertType === 'warning').length,
        totalAmount: alerts.reduce((sum, a) => sum + a.amount, 0)
      }
    });

  } catch (error) {
    console.error('Get due date alerts error:', error);
    res.status(500).json({ message: 'Server error while fetching due date alerts' });
  }
});

// @route   GET /api/loans/:id/ai-insights
// @desc    Get AI-powered insights for loan installments
// @access  Private
router.get('/:id/ai-insights', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    loan.updateLoanStatus();
    await loan.save();

    const summary = loan.getInstallmentSummary();
    const upcomingDueDates = loan.getUpcomingDueDates(3);
    const user = await User.findById(req.user._id);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const prompt = `You are DhanSarthi, an AI financial advisor. Analyze this loan's installment status and provide actionable insights:

Loan Details:
- Name: ${loan.loanName}
- Type: ${loan.loanType}
- EMI Amount: ₹${loan.emiAmount.toLocaleString()}
- Interest Rate: ${loan.interestRate}%
- Monthly Due Date: ${upcomingDueDates[0]?.dueDateDay || 'N/A'} of each month

Installment Summary:
- Total Installments: ${summary.total}
- Paid: ${summary.paid} (${summary.completionPercentage}%)
- Remaining: ${summary.remaining}
- Overdue: ${summary.overdue}
- Pending (within 7 days): ${summary.pending}
- Upcoming: ${summary.upcoming}

Upcoming Due Dates:
${upcomingDueDates.slice(0, 3).map(d => `- EMI #${d.emiNumber}: ${new Date(d.dueDate).toLocaleDateString()} (${d.status}, ${d.daysUntilDue > 0 ? d.daysUntilDue + ' days away' : d.daysOverdue + ' days overdue'})`).join('\n')}

User Income: ₹${user.income?.toLocaleString() || 'Not provided'}

Provide a concise analysis (4-5 sentences) covering:
1. Current payment status and any urgent actions needed
2. Payment pattern insights (if overdue or consistently late)
3. One specific recommendation to improve loan management
4. Reminder about the monthly due date (${upcomingDueDates[0]?.dueDateDay || 'N/A'} of each month)

Use Indian Rupees (₹) and keep it friendly and actionable.`;

    const result = await model.generateContent(prompt);
    const aiInsights = result.response.text();

    res.json({
      loanId: loan._id,
      loanName: loan.loanName,
      summary,
      upcomingDueDates,
      aiInsights,
      monthlyDueDate: upcomingDueDates[0]?.dueDateDay || null
    });

  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({ message: 'Server error while generating AI insights' });
  }
});

module.exports = router;
