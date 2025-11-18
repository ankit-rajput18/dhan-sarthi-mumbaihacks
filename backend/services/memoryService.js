const UserMemory = require('../models/UserMemory');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');
const ChatMessage = require('../models/ChatMessage');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract financial facts from conversation using AI
 */
async function extractFactsFromConversation(userId, messages) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
      }
    });

    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `Analyze this financial conversation and extract key facts about the user's financial situation.
Focus on: goals, income sources, spending habits, risk tolerance, life events, preferences.

Conversation:
${conversationText}

Return ONLY a JSON object with these fields (use null if not mentioned):
{
  "goals": ["goal1", "goal2"],
  "incomeSource": "primary income source",
  "riskTolerance": "low/medium/high",
  "spendingHabits": ["habit1", "habit2"],
  "lifeEvents": ["event1"],
  "preferences": ["preference1"]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting facts:', error);
    return null;
  }
}

module.exports.extractFactsFromConversation = extractFactsFromConversation;

/**
 * Update user memory from transaction patterns
 */
async function updateMemoryFromTransactions(userId) {
  try {
    const memory = await UserMemory.getOrCreate(userId);
    
    // Get last 90 days of transactions
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: ninetyDaysAgo }
    }).sort({ date: -1 });

    if (transactions.length === 0) return memory;

    // Analyze spending patterns
    const categorySpending = {};
    const recurringExpenses = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpenses += t.amount;
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
        
        // Track recurring expenses (same description)
        if (t.description) {
          const key = t.description.toLowerCase().trim();
          recurringExpenses[key] = (recurringExpenses[key] || 0) + 1;
        }
      }
    });

    // Find top spending categories
    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        percentage: ((amount / totalExpenses) * 100).toFixed(1)
      }));

    // Find recurring expenses (appeared 3+ times)
    const recurring = Object.entries(recurringExpenses)
      .filter(([_, count]) => count >= 3)
      .map(([desc, count]) => ({ description: desc, frequency: count }));

    // Update memory
    memory.financialProfile.avgMonthlyIncome = Math.round(totalIncome / 3);
    memory.financialProfile.avgMonthlyExpenses = Math.round(totalExpenses / 3);
    memory.financialProfile.savingsRate = totalIncome > 0 
      ? parseFloat(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1))
      : 0;
    memory.financialProfile.topSpendingCategories = topCategories;

    // Store behavioral insights
    if (!memory.behavioralInsights) {
      memory.behavioralInsights = {};
    }
    memory.behavioralInsights.recurringExpenses = recurring;
    memory.behavioralInsights.transactionCount = transactions.length;
    memory.behavioralInsights.lastAnalyzed = new Date();

    await memory.save();
    return memory;

  } catch (error) {
    console.error('Error updating memory from transactions:', error);
    throw error;
  }
}

module.exports.updateMemoryFromTransactions = updateMemoryFromTransactions;

/**
 * Analyze conversation and update memory
 */
async function analyzeAndUpdateMemory(userId) {
  try {
    const memory = await UserMemory.getOrCreate(userId);
    
    // Get recent conversations (last 20 messages)
    const recentMessages = await ChatMessage.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    if (recentMessages.length < 2) return memory;

    // Extract facts from conversation
    const facts = await extractFactsFromConversation(userId, recentMessages);
    
    if (facts) {
      // Update memory with extracted facts
      if (!memory.extractedFacts) {
        memory.extractedFacts = {};
      }

      if (facts.goals && facts.goals.length > 0) {
        memory.extractedFacts.mentionedGoals = facts.goals;
      }
      
      if (facts.incomeSource) {
        memory.extractedFacts.incomeSource = facts.incomeSource;
      }
      
      if (facts.riskTolerance) {
        memory.extractedFacts.riskTolerance = facts.riskTolerance;
      }
      
      if (facts.spendingHabits && facts.spendingHabits.length > 0) {
        memory.extractedFacts.spendingHabits = facts.spendingHabits;
      }
      
      if (facts.lifeEvents && facts.lifeEvents.length > 0) {
        memory.extractedFacts.lifeEvents = facts.lifeEvents;
      }
      
      if (facts.preferences && facts.preferences.length > 0) {
        memory.extractedFacts.preferences = facts.preferences;
      }

      memory.extractedFacts.lastExtracted = new Date();
      await memory.save();
    }

    return memory;

  } catch (error) {
    console.error('Error analyzing conversation:', error);
    throw error;
  }
}

module.exports.analyzeAndUpdateMemory = analyzeAndUpdateMemory;

/**
 * Get comprehensive memory summary for user
 */
async function getMemorySummary(userId) {
  try {
    const memory = await UserMemory.getOrCreate(userId);
    
    // Get additional context
    const [goals, loans, recentChats] = await Promise.all([
      Goal.find({ user: userId, status: 'active' }).lean(),
      Loan.find({ user: userId, status: 'active' }).lean(),
      ChatMessage.countDocuments({ user: userId })
    ]);

    return {
      profile: {
        avgMonthlyIncome: memory.financialProfile.avgMonthlyIncome,
        avgMonthlyExpenses: memory.financialProfile.avgMonthlyExpenses,
        savingsRate: memory.financialProfile.savingsRate,
        topSpendingCategories: memory.financialProfile.topSpendingCategories
      },
      currentState: {
        lastExpenses: memory.lastExpenses,
        goalsSummary: memory.goalsSummary,
        activeLoans: memory.activeLoans,
        lastAIAdvice: memory.lastAIAdvice
      },
      extractedFacts: memory.extractedFacts || {},
      behavioralInsights: memory.behavioralInsights || {},
      stats: {
        totalGoals: goals.length,
        totalLoans: loans.length,
        totalConversations: recentChats,
        lastUpdated: memory.updatedAt
      }
    };

  } catch (error) {
    console.error('Error getting memory summary:', error);
    throw error;
  }
}

module.exports.getMemorySummary = getMemorySummary;

/**
 * Clear specific parts of user memory
 */
async function clearMemory(userId, sections = []) {
  try {
    const memory = await UserMemory.getOrCreate(userId);

    if (sections.includes('all') || sections.length === 0) {
      // Clear everything except userId
      memory.lastExpenses = '';
      memory.goalsSummary = '';
      memory.activeLoans = [];
      memory.taxTips = [];
      memory.lastAIAdvice = '';
      memory.extractedFacts = {};
      memory.behavioralInsights = {};
      memory.financialProfile = {
        avgMonthlyIncome: 0,
        avgMonthlyExpenses: 0,
        savingsRate: 0,
        topSpendingCategories: []
      };
    } else {
      // Clear specific sections
      if (sections.includes('conversations')) {
        memory.lastAIAdvice = '';
        memory.extractedFacts = {};
      }
      if (sections.includes('financial')) {
        memory.lastExpenses = '';
        memory.goalsSummary = '';
        memory.activeLoans = [];
        memory.financialProfile = {
          avgMonthlyIncome: 0,
          avgMonthlyExpenses: 0,
          savingsRate: 0,
          topSpendingCategories: []
        };
      }
      if (sections.includes('behavioral')) {
        memory.behavioralInsights = {};
      }
    }

    await memory.save();
    return memory;

  } catch (error) {
    console.error('Error clearing memory:', error);
    throw error;
  }
}

module.exports.clearMemory = clearMemory;

/**
 * Generate personalized insights based on memory
 */
async function generatePersonalizedInsights(userId) {
  try {
    const memory = await UserMemory.getOrCreate(userId);
    const summary = await getMemorySummary(userId);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    });

    const prompt = `Based on this user's financial memory, generate 3 personalized insights:

Financial Profile:
- Avg Monthly Income: ₹${summary.profile.avgMonthlyIncome}
- Avg Monthly Expenses: ₹${summary.profile.avgMonthlyExpenses}
- Savings Rate: ${summary.profile.savingsRate}%
- Top Spending: ${summary.profile.topSpendingCategories.map(c => c.category).join(', ')}

Current State:
- ${summary.currentState.lastExpenses}
- ${summary.currentState.goalsSummary}
- Active Loans: ${summary.currentState.activeLoans.length}

Extracted Facts:
${JSON.stringify(summary.extractedFacts, null, 2)}

Generate 3 specific, actionable insights that show you remember their situation and can help them improve.
Keep each insight to 1-2 sentences.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error('Error generating personalized insights:', error);
    throw error;
  }
}

module.exports.generatePersonalizedInsights = generatePersonalizedInsights;
