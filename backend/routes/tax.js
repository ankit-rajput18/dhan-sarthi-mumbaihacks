const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { calculateTaxLiability, generateTaxTips } = require('../services/taxService');
const { generateAITaxInsights, chatWithTaxAI, generateSmartReminders } = require('../services/taxAIService');
const { generateTaxRecommendation, getLatestRecommendation } = require('../services/taxAIRecommendationService');

// @route   GET /api/tax/profile
// @desc    Get user's tax profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      onboardingCompleted: user.onboardingCompleted || false,
      profile: user.profile || {},
      taxProfile: user.taxProfile || {}
    });
  } catch (error) {
    console.error('Get tax profile error:', error);
    res.status(500).json({ message: 'Failed to fetch tax profile' });
  }
});

// @route   POST /api/tax/profile
// @desc    Update user's tax profile (onboarding data)
// @access  Private
router.post('/profile', auth, async (req, res) => {
  try {
    const {
      age,
      gender,
      profession,
      city,
      cityType,
      monthlyIncome,
      annualIncome,
      payingRent,
      monthlyRent,
      hasHealthInsurance,
      healthInsurancePremium,
      parentsHealthInsurance,
      hasHomeLoan,
      homeLoanEMI,
      homeLoanInterest,
      investments80C,
      hasEducationLoan,
      educationLoanInterest,
      taxRegime
    } = req.body;

    const user = await User.findById(req.user._id);

    // Update profile
    user.profile = {
      age: age || user.profile?.age,
      gender: gender || user.profile?.gender,
      profession: profession || user.profile?.profession,
      city: city || user.profile?.city,
      cityType: cityType || user.profile?.cityType,
      monthlyIncome: monthlyIncome || user.profile?.monthlyIncome || 0,
      annualIncome: annualIncome || (monthlyIncome * 12) || user.profile?.annualIncome || 0
    };

    // Update tax profile
    user.taxProfile = {
      taxRegime: taxRegime || user.taxProfile?.taxRegime || 'new',
      payingRent: payingRent !== undefined ? payingRent : user.taxProfile?.payingRent || false,
      monthlyRent: monthlyRent || user.taxProfile?.monthlyRent || 0,
      hasHealthInsurance: hasHealthInsurance !== undefined ? hasHealthInsurance : user.taxProfile?.hasHealthInsurance || false,
      healthInsurancePremium: healthInsurancePremium || user.taxProfile?.healthInsurancePremium || 0,
      parentsHealthInsurance: parentsHealthInsurance || user.taxProfile?.parentsHealthInsurance || 0,
      hasHomeLoan: hasHomeLoan !== undefined ? hasHomeLoan : user.taxProfile?.hasHomeLoan || false,
      homeLoanEMI: homeLoanEMI || user.taxProfile?.homeLoanEMI || 0,
      homeLoanInterest: homeLoanInterest || user.taxProfile?.homeLoanInterest || 0,
      investments80C: investments80C || user.taxProfile?.investments80C || {
        ppf: 0,
        elss: 0,
        lifeInsurance: 0,
        epf: 0,
        nps: 0
      },
      hasEducationLoan: hasEducationLoan !== undefined ? hasEducationLoan : user.taxProfile?.hasEducationLoan || false,
      educationLoanInterest: educationLoanInterest || user.taxProfile?.educationLoanInterest || 0,
      lastUpdated: new Date()
    };

    // Mark onboarding as completed
    user.onboardingCompleted = true;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      onboardingCompleted: user.onboardingCompleted,
      profile: user.profile,
      taxProfile: user.taxProfile
    });
  } catch (error) {
    console.error('Update tax profile error:', error);
    res.status(500).json({ message: 'Failed to update tax profile' });
  }
});

// @route   GET /api/tax/calculate
// @desc    Calculate tax liability
// @access  Private
router.get('/calculate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.onboardingCompleted) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    const taxCalculation = calculateTaxLiability(user.profile, user.taxProfile);

    res.json({
      calculation: taxCalculation,
      profile: {
        annualIncome: user.profile.annualIncome,
        profession: user.profile.profession,
        regime: user.taxProfile.taxRegime
      }
    });
  } catch (error) {
    console.error('Calculate tax error:', error);
    res.status(500).json({ message: 'Failed to calculate tax' });
  }
});

// @route   GET /api/tax/tips
// @desc    Get personalized tax tips with both regime calculations
// @access  Private
router.get('/tips', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.onboardingCompleted) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    // Calculate for BOTH regimes
    const oldRegimeCalc = calculateTaxLiability(
      user.profile, 
      { ...user.taxProfile, taxRegime: 'old' }
    );
    
    const newRegimeCalc = calculateTaxLiability(
      user.profile, 
      { ...user.taxProfile, taxRegime: 'new' }
    );

    // Determine which is better
    const savings = Math.abs(oldRegimeCalc.taxLiability - newRegimeCalc.taxLiability);
    const recommendedRegime = oldRegimeCalc.taxLiability < newRegimeCalc.taxLiability ? 'old' : 'new';
    
    // Use the better regime for tips
    const bestCalculation = recommendedRegime === 'old' ? oldRegimeCalc : newRegimeCalc;
    const tips = generateTaxTips(user.profile, { ...user.taxProfile, taxRegime: recommendedRegime }, bestCalculation);

    res.json({
      tips,
      oldRegime: oldRegimeCalc,
      newRegime: newRegimeCalc,
      recommendedRegime,
      savings,
      calculation: bestCalculation, // For backward compatibility
      profile: {
        annualIncome: user.profile.annualIncome,
        profession: user.profile.profession
      }
    });
  } catch (error) {
    console.error('Get tax tips error:', error);
    res.status(500).json({ message: 'Failed to generate tax tips' });
  }
});

// @route   POST /api/tax/compare-regimes
// @desc    Compare old vs new tax regime
// @access  Private
router.post('/compare-regimes', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.onboardingCompleted) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    // Calculate for both regimes
    const oldRegimeCalc = calculateTaxLiability(
      user.profile, 
      { ...user.taxProfile, taxRegime: 'old' }
    );
    
    const newRegimeCalc = calculateTaxLiability(
      user.profile, 
      { ...user.taxProfile, taxRegime: 'new' }
    );

    const savings = oldRegimeCalc.taxLiability - newRegimeCalc.taxLiability;
    const recommendation = savings > 0 ? 'new' : 'old';

    res.json({
      oldRegime: oldRegimeCalc,
      newRegime: newRegimeCalc,
      savings: Math.abs(savings),
      recommendation,
      message: recommendation === 'new' 
        ? `New regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')}`
        : `Old regime saves you ₹${Math.abs(savings).toLocaleString('en-IN')}`
    });
  } catch (error) {
    console.error('Compare regimes error:', error);
    res.status(500).json({ message: 'Failed to compare tax regimes' });
  }
});

// @route   GET /api/tax/ai-insights
// @desc    Get AI-powered tax insights based on transactions
// @access  Private
router.get('/ai-insights', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const userName = user.name || 'User';

    const result = await generateAITaxInsights(req.user._id, userName);

    if (result.needsOnboarding) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI Insights error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate AI insights' });
  }
});

// @route   POST /api/tax/ai-chat
// @desc    Chat with Tax AI Agent
// @access  Private
router.post('/ai-chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await User.findById(req.user._id);
    const userName = user.name || 'User';

    const result = await chatWithTaxAI(req.user._id, message, userName);

    res.json(result);
  } catch (error) {
    console.error('Tax AI Chat error:', error);
    res.status(500).json({ message: error.message || 'Failed to chat with Tax AI' });
  }
});

// @route   GET /api/tax/reminders
// @desc    Get smart tax reminders based on time of year
// @access  Private
router.get('/reminders', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.onboardingCompleted) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    const reminders = generateSmartReminders(user.profile, user.taxProfile);

    res.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Failed to get reminders' });
  }
});

// @route   GET /api/tax/ai-recommendation
// @desc    Get latest AI tax recommendation
// @access  Private
router.get('/ai-recommendation', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.onboardingCompleted) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    const recommendation = await getLatestRecommendation(req.user._id);

    if (!recommendation) {
      return res.status(404).json({ 
        message: 'No recommendation found. Generate one first.',
        hasRecommendation: false
      });
    }

    res.json(recommendation);
  } catch (error) {
    console.error('Get AI recommendation error:', error);
    res.status(500).json({ message: 'Failed to get AI recommendation' });
  }
});

// @route   POST /api/tax/ai-recommendation/generate
// @desc    Generate new AI tax recommendation
// @access  Private
router.post('/ai-recommendation/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.onboardingCompleted) {
      return res.status(400).json({ 
        message: 'Please complete your profile first',
        onboardingRequired: true
      });
    }

    const recommendation = await generateTaxRecommendation(req.user._id);

    res.json(recommendation);
  } catch (error) {
    console.error('Generate AI recommendation error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate AI recommendation' });
  }
});

module.exports = router;
