const { GoogleGenerativeAI } = require('@google/generative-ai');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');
const Budget = require('../models/Budget');
const ChatMessage = require('../models/ChatMessage');
const UserMemory = require('../models/UserMemory');
const User = require('../models/User');
const { analyzeAndUpdateMemory } = require('./memoryService');
const { generateLendingRecommendations } = require('./lendingAIService');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to retry API calls
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === maxRetries - 1;
      const isOverloaded = error.message?.includes('overloaded') || error.message?.includes('503');
      
      if (isLastRetry || !isOverloaded) {
        throw error;
      }
      
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

/**
 * Fetch comprehensive financial data for a user
 */
async function fetchUserFinancialData(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  try {
    // Fetch all financial data in parallel
    const [
      currentMonthTransactions,
      lastMonthTransactions,
      allTransactions,
      yearTransactions,
      goals,
      loans,
      budget,
      user
    ] = await Promise.all([
      Transaction.find({ user: userId, date: { $gte: startOfMonth } }).lean(),
      Transaction.find({ user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).lean(),
      Transaction.find({ user: userId }).sort({ date: -1 }).limit(100).lean(),
      Transaction.find({ user: userId, date: { $gte: startOfYear } }).lean(),
      Goal.find({ user: userId, status: 'active' }).lean(),
      Loan.find({ user: userId, status: 'active' }).lean(),
      Budget.findOne({ user: userId, year: now.getFullYear(), month: now.getMonth() + 1 }).lean(),
      User.findById(userId).select('name email ageGroup profile taxProfile').lean()
    ]);

    return {
      currentMonthTransactions,
      lastMonthTransactions,
      allTransactions,
      yearTransactions,
      goals,
      loans,
      budget,
      user
    };
  } catch (error) {
    console.error('Error fetching user financial data:', error);
    throw error;
  }
}

module.exports = {
  fetchUserFinancialData
};

/**
 * Analyze and structure financial data for AI context
 */
function analyzeFinancialData(data) {
  const { currentMonthTransactions, lastMonthTransactions, yearTransactions, goals, loans, budget, user } = data;

  // Current month analysis
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Last month analysis
  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Year-to-date analysis
  const ytdIncome = yearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const ytdExpenses = yearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown (current month)
  const categoryMap = {};
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: currentExpenses > 0 ? ((amount / currentExpenses) * 100).toFixed(1) : 0
    }));

  // Goals analysis with allocations
  const goalsAnalysis = goals.map(g => ({
    name: g.name,
    target: g.targetAmount,
    current: g.currentAmount,
    remaining: g.targetAmount - g.currentAmount,
    progress: ((g.currentAmount / g.targetAmount) * 100).toFixed(1),
    deadline: g.deadline,
    category: g.category,
    monthlyAllocation: g.monthlyAllocation || 0,
    priority: g.priority || 'medium'
  }));

  const totalGoalAllocations = goals.reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);

  // Loans analysis
  const loansAnalysis = loans.map(l => ({
    name: l.loanName,
    type: l.loanType,
    emi: l.emiAmount,
    remaining: l.remainingBalance,
    interestRate: l.interestRate,
    riskLevel: l.riskLevel || 'Unknown'
  }));

  const totalEMI = loans.reduce((sum, l) => sum + (l.emiAmount || 0), 0);

  // Calculate available funds
  const totalIncome = user?.totalIncome || currentIncome;
  const totalCommitments = totalEMI + totalGoalAllocations;
  const availableFunds = totalIncome - currentExpenses - totalCommitments;
  const emiToIncomeRatio = totalIncome > 0 ? ((totalEMI / totalIncome) * 100).toFixed(1) : 0;

  return {
    userProfile: {
      name: user?.name || 'User',
      ageGroup: user?.ageGroup,
      age: user?.profile?.age,
      gender: user?.profile?.gender,
      profession: user?.profile?.profession,
      city: user?.profile?.city,
      cityType: user?.profile?.cityType,
      monthlyIncome: user?.profile?.monthlyIncome || 0,
      annualIncome: user?.profile?.annualIncome || 0,
      taxRegime: user?.taxProfile?.taxRegime || 'new',
      payingRent: user?.taxProfile?.payingRent,
      monthlyRent: user?.taxProfile?.monthlyRent || 0,
      hasHealthInsurance: user?.taxProfile?.hasHealthInsurance,
      healthInsurancePremium: user?.taxProfile?.healthInsurancePremium || 0,
      hasHomeLoan: user?.taxProfile?.hasHomeLoan,
      homeLoanEMI: user?.taxProfile?.homeLoanEMI || 0,
      investments80C: user?.taxProfile?.investments80C || {},
      hasEducationLoan: user?.taxProfile?.hasEducationLoan
    },
    currentMonth: {
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentIncome - currentExpenses,
      savingsRate: currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome * 100).toFixed(1) : 0
    },
    lastMonth: {
      income: lastMonthIncome,
      expenses: lastMonthExpenses,
      savings: lastMonthIncome - lastMonthExpenses
    },
    yearToDate: {
      income: ytdIncome,
      expenses: ytdExpenses,
      savings: ytdIncome - ytdExpenses,
      avgMonthlyIncome: Math.round(ytdIncome / (new Date().getMonth() + 1)),
      avgMonthlyExpenses: Math.round(ytdExpenses / (new Date().getMonth() + 1))
    },
    comparison: {
      incomeChange: lastMonthIncome > 0 ? (((currentIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1) : 0,
      expenseChange: lastMonthExpenses > 0 ? (((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(1) : 0
    },
    topCategories,
    goals: goalsAnalysis,
    loans: loansAnalysis,
    totalEMI,
    totalGoalAllocations,
    totalCommitments,
    availableFunds,
    emiToIncomeRatio,
    budget: budget ? budget.categories : []
  };
}

module.exports.analyzeFinancialData = analyzeFinancialData;

/**
 * Create structured prompt with user's financial context and memory
 */
function createFinancialContextPrompt(analysis, userName = 'User', memory = null) {
  const { userProfile, currentMonth, lastMonth, yearToDate, comparison, topCategories, goals, loans, totalEMI, totalGoalAllocations, totalCommitments, availableFunds, emiToIncomeRatio, budget } = analysis;

  let prompt = `You are DhanSarthi, a friendly and knowledgeable AI financial advisor for young Indians. You're helping ${userName} manage their finances better.

IMPORTANT RULES:
- Always use Indian Rupees (₹) in your responses
- Be encouraging but honest
- Give specific, actionable advice based on their actual data
- Use simple language, avoid jargon
- Keep responses concise (2-3 paragraphs max)
- When suggesting savings, be realistic
- Use the user's memory context to provide personalized, continuous advice
- Consider their tax regime when giving tax advice
- Personalize advice based on their age, profession, and life situation

${memory ? `USER'S MEMORY (Previous Conversations & Patterns):
${JSON.stringify({
  lastExpenses: memory.lastExpenses,
  goalsSummary: memory.goalsSummary,
  activeLoans: memory.activeLoans.map(l => l.summary),
  lastAIAdvice: memory.lastAIAdvice,
  financialProfile: memory.financialProfile
}, null, 2)}

` : ''}👤 USER PROFILE:
- Age: ${userProfile.age || 'Not specified'} years (${userProfile.ageGroup || 'Not specified'})
- Profession: ${userProfile.profession || 'Not specified'}
- Location: ${userProfile.city || 'Not specified'} (${userProfile.cityType || 'Not specified'})
- Gender: ${userProfile.gender || 'Not specified'}
- Monthly Income: ₹${(userProfile.monthlyIncome || 0).toLocaleString()}
- Annual Income: ₹${(userProfile.annualIncome || 0).toLocaleString()}
- Tax Regime: ${userProfile.taxRegime}

💼 TAX & COMMITMENTS:
- Paying Rent: ${userProfile.payingRent ? `Yes (₹${userProfile.monthlyRent.toLocaleString()}/month)` : 'No'}
- Health Insurance: ${userProfile.hasHealthInsurance ? `Yes (₹${userProfile.healthInsurancePremium.toLocaleString()}/year)` : 'No'}
- Home Loan: ${userProfile.hasHomeLoan ? `Yes (₹${userProfile.homeLoanEMI.toLocaleString()}/month EMI)` : 'No'}
- Education Loan: ${userProfile.hasEducationLoan ? 'Yes' : 'No'}
${userProfile.investments80C && Object.keys(userProfile.investments80C).length > 0 ? `- 80C Investments: ${Object.entries(userProfile.investments80C).filter(([k,v]) => v > 0).map(([k,v]) => `${k.toUpperCase()} ₹${v.toLocaleString()}`).join(', ')}` : ''}

📊 USER'S FINANCIAL SNAPSHOT:

📊 CURRENT MONTH (${new Date().toLocaleString('default', { month: 'long' })}):
- Income: ₹${currentMonth.income.toLocaleString()}
- Expenses: ₹${currentMonth.expenses.toLocaleString()}
- Savings: ₹${currentMonth.savings.toLocaleString()} (${currentMonth.savingsRate}% savings rate)

📈 COMPARISON WITH LAST MONTH:
- Income change: ${comparison.incomeChange}%
- Expense change: ${comparison.expenseChange}%

💰 TOP SPENDING CATEGORIES:
${topCategories.map((cat, i) => `${i + 1}. ${cat.category}: ₹${cat.amount.toLocaleString()} (${cat.percentage}%)`).join('\n')}
`;

  if (budget && budget.length > 0) {
    prompt += `\n📋 BUDGET:\n${budget.map(b => `- ${b.name}: ₹${b.amount.toLocaleString()}`).join('\n')}`;
  }

  if (goals && goals.length > 0) {
    prompt += `\n\n🎯 ACTIVE GOALS:\n${goals.map((g, i) => 
      `${i + 1}. ${g.name}: ₹${g.current.toLocaleString()} / ₹${g.target.toLocaleString()} (${g.progress}% complete, ₹${g.remaining.toLocaleString()} remaining)`
    ).join('\n')}`;
  }

  if (loans && loans.length > 0) {
    prompt += `\n\n💳 ACTIVE LOANS:\n${loans.map((l, i) => 
      `${i + 1}. ${l.name}: EMI ₹${l.emi.toLocaleString()}/month, Outstanding ₹${l.remaining.toLocaleString()}, Interest ${l.interestRate}%, Risk: ${l.riskLevel}`
    ).join('\n')}`;
    prompt += `\nTotal EMI burden: ₹${totalEMI.toLocaleString()}/month`;
  }

  prompt += `\n\nBased on this data, provide helpful financial advice.`;

  return prompt;
}

module.exports.createFinancialContextPrompt = createFinancialContextPrompt;

/**
 * Get AI response with chat history context and user memory
 */
async function getAIResponse(userId, userMessage, userName = 'User') {
  try {
    // Fetch user's financial data
    const financialData = await fetchUserFinancialData(userId);
    const analysis = analyzeFinancialData(financialData);

    // Get or create user memory
    let userMemory = await UserMemory.getOrCreate(userId);
    
    // Update memory with latest financial data
    userMemory.updateFromFinancialData(analysis);
    await userMemory.save();

    // Get recent chat history for context continuity
    const chatHistory = await ChatMessage.getRecentHistory(userId, 10);

    // Initialize Gemini model (using 2.5 Flash - free tier)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    // Build conversation history for Gemini
    const conversationHistory = [];

    // Add system context (financial snapshot with memory)
    const systemContext = createFinancialContextPrompt(analysis, userName, userMemory);
    conversationHistory.push({
      role: 'user',
      parts: [{ text: systemContext }]
    });
    conversationHistory.push({
      role: 'model',
      parts: [{ text: 'I understand your financial situation and remember our previous conversations. I\'m here to help you make better financial decisions. What would you like to know?' }]
    });

    // Add recent chat history (last 10 messages)
    const recentChats = chatHistory.slice(-10);
    recentChats.forEach(msg => {
      if (msg.role === 'user') {
        conversationHistory.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        conversationHistory.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    });

    // Start chat with history
    const chat = model.startChat({
      history: conversationHistory
    });

    // Send user's message with retry logic
    const result = await retryWithBackoff(async () => {
      return await chat.sendMessage(userMessage);
    });
    const aiResponse = result.response.text();

    // Save messages to database sequentially to ensure proper ordering
    // Save user message first
    await ChatMessage.create({
      user: userId,
      role: 'user',
      content: userMessage,
      metadata: {
        financialSnapshot: {
          income: analysis.currentMonth.income,
          expenses: analysis.currentMonth.expenses,
          savings: analysis.currentMonth.savings,
          topCategories: analysis.topCategories
        },
        dataUsed: {
          transactions: true,
          goals: analysis.goals.length > 0,
          loans: analysis.loans.length > 0,
          budgets: analysis.budget.length > 0
        }
      }
    });

    // Small delay to ensure distinct timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Save AI response second
    await ChatMessage.create({
      user: userId,
      role: 'assistant',
      content: aiResponse
    });

    // Update user memory with last AI advice
    userMemory.lastAIAdvice = aiResponse.substring(0, 500); // Store first 500 chars
    await userMemory.save();

    // Cleanup old messages (keep last 50)
    await ChatMessage.cleanupOldMessages(userId);

    // Analyze conversation and extract facts (async, don't wait)
    analyzeAndUpdateMemory(userId).catch(err => 
      console.error('Background memory analysis error:', err)
    );

    return {
      response: aiResponse,
      context: {
        income: analysis.currentMonth.income,
        expenses: analysis.currentMonth.expenses,
        savings: analysis.currentMonth.savings,
        savingsRate: analysis.currentMonth.savingsRate
      }
    };

  } catch (error) {
    console.error('AI Response Error:', error);
    throw new Error('Failed to generate AI response: ' + error.message);
  }
}

module.exports.getAIResponse = getAIResponse;

/**
 * Generate automatic financial insights
 */
async function generateInsights(userId, userName = 'User') {
  try {
    const financialData = await fetchUserFinancialData(userId);
    const analysis = analyzeFinancialData(financialData);

    // Get or create user memory
    let userMemory = await UserMemory.getOrCreate(userId);
    userMemory.updateFromFinancialData(analysis);
    await userMemory.save();

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    });

    const prompt = `${createFinancialContextPrompt(analysis, userName, userMemory)}

Generate 3 specific financial insights for ${userName}:
1. One observation about their spending pattern
2. One actionable tip to improve savings
3. One insight about their financial goals or loans (if any)

Format each insight as a short, friendly message (1-2 sentences each).`;

    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    });
    const insights = result.response.text();

    return {
      insights,
      analysis
    };

  } catch (error) {
    console.error('Generate Insights Error:', error);
    throw new Error('Failed to generate insights: ' + error.message);
  }
}

module.exports.generateInsights = generateInsights;
