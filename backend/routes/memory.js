const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getMemorySummary,
  clearMemory,
  updateMemoryFromTransactions,
  analyzeAndUpdateMemory,
  generatePersonalizedInsights
} = require('../services/memoryService');

/**
 * @route   GET /api/memory
 * @desc    Get user's memory summary
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const summary = await getMemorySummary(req.user._id);
    
    res.json({
      success: true,
      memory: summary
    });

  } catch (error) {
    console.error('Get memory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memory',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/memory/update
 * @desc    Manually trigger memory update from transactions
 * @access  Private
 */
router.post('/update', auth, async (req, res) => {
  try {
    const memory = await updateMemoryFromTransactions(req.user._id);
    
    res.json({
      success: true,
      message: 'Memory updated from transactions',
      memory: {
        avgMonthlyIncome: memory.financialProfile.avgMonthlyIncome,
        avgMonthlyExpenses: memory.financialProfile.avgMonthlyExpenses,
        savingsRate: memory.financialProfile.savingsRate,
        topCategories: memory.financialProfile.topSpendingCategories
      }
    });

  } catch (error) {
    console.error('Update memory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update memory',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/memory/analyze
 * @desc    Analyze conversations and extract facts
 * @access  Private
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const memory = await analyzeAndUpdateMemory(req.user._id);
    
    res.json({
      success: true,
      message: 'Conversation analyzed and memory updated',
      extractedFacts: memory.extractedFacts || {}
    });

  } catch (error) {
    console.error('Analyze memory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze conversations',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/memory/insights
 * @desc    Generate personalized insights based on memory
 * @access  Private
 */
router.post('/insights', auth, async (req, res) => {
  try {
    const insights = await generatePersonalizedInsights(req.user._id);
    
    res.json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('Generate insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/memory
 * @desc    Clear user memory (all or specific sections)
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    const { sections } = req.body; // ['all', 'conversations', 'financial', 'behavioral']
    
    const memory = await clearMemory(req.user._id, sections || ['all']);
    
    res.json({
      success: true,
      message: 'Memory cleared successfully',
      clearedSections: sections || ['all']
    });

  } catch (error) {
    console.error('Clear memory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear memory',
      error: error.message
    });
  }
});

module.exports = router;
