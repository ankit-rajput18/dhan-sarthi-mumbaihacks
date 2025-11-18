const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const { getAIResponse, generateInsights } = require('../services/aiService');

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI mentor
 * @access  Private
 */
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get user name from authenticated user
    const userName = req.user.name || 'User';

    // Get AI response with full context
    const result = await getAIResponse(req.user._id, message, userName);

    res.json({
      success: true,
      reply: result.response,
      context: result.context,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get AI response',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/ai/history
 * @desc    Get chat history for current user
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await ChatMessage.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('role content timestamp')
      .lean();

    res.json({
      success: true,
      history: history.reverse(), // Oldest first
      count: history.length
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/insights
 * @desc    Generate automatic financial insights
 * @access  Private
 */
router.post('/insights', auth, async (req, res) => {
  try {
    const userName = req.user.name || 'User';
    
    const result = await generateInsights(req.user._id, userName);

    res.json({
      success: true,
      insights: result.insights,
      financialSummary: {
        income: result.analysis.currentMonth.income,
        expenses: result.analysis.currentMonth.expenses,
        savings: result.analysis.currentMonth.savings,
        savingsRate: result.analysis.currentMonth.savingsRate,
        topCategories: result.analysis.topCategories
      }
    });

  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate insights',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/ai/history
 * @desc    Clear chat history for current user
 * @access  Private
 */
router.delete('/history', auth, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: 'Chat history cleared successfully'
    });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear chat history',
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/ai/message/:timestamp
 * @desc    Delete a specific message and its response
 * @access  Private
 */
router.delete('/message/:timestamp', auth, async (req, res) => {
  try {
    const { timestamp } = req.params;
    const userId = req.user._id;

    // Find the user message by timestamp
    const userMessage = await ChatMessage.findOne({
      user: userId,
      role: 'user',
      timestamp: new Date(timestamp)
    });

    if (!userMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Find the AI response that came right after this user message
    const aiResponse = await ChatMessage.findOne({
      user: userId,
      role: 'assistant',
      timestamp: { $gt: userMessage.timestamp }
    }).sort({ timestamp: 1 });

    // Delete both messages
    await ChatMessage.deleteOne({ _id: userMessage._id });
    if (aiResponse) {
      await ChatMessage.deleteOne({ _id: aiResponse._id });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
      deletedCount: aiResponse ? 2 : 1
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

module.exports = router;
