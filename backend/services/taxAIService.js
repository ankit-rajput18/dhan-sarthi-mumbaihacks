const { GoogleGenerativeAI } = require('@google/generative-ai');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const UserMemory = require('../models/UserMemory');
const { calculateTaxLiability, generateTaxTips } = require('./taxService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AGENTIC TAX ADVISOR
 * Analyzes transactions, learns patterns, and proactively suggests tax optimizations
 */

// Retry helper for API calls
async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === maxRetries - 1;
      const isOverloaded = error.message?.includes('overloaded') || error.message?.includes('503');
      
      if (isLastRetry || !isOverloaded) throw error;
      
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

/**
 * Analyze user's transactions to find tax-saving opportunities
 */
async function analyzeTaxOpportunities(userId) {
  const now = new Date();
  const financialYearStart = new Date(now.getFullYear(), 3, 1); // April 1st
  
  // Get all transactions since FY start
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: financialYearStart }
  }).lean();

  const opportunities = {
    healthInsurance: { found: false, amount: 0, transactions: [] },
    lifeInsurance: { found: false, amount: 0, transactions: [] },
    mutualFunds: { found: false, amount: 0, transactions: [] },
    ppf: { found: false, amount: 0, transactions: [] },
    nps: { found: false, amount: 0, transactions: [] },
    rent: { found: false, amount: 0, transactions: [] },
    homeLoan: { found: false, amount: 0, transactions: [] },
    educationLoan: { found: false, amount: 0, transactions: [] },
    donations: { found: false, amount: 0, transactions: [] }
  };

  // Analyze transactions for tax-saving patterns
  transactions.forEach(t => {
    const desc = (t.description || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    
    // Health Insurance (80D)
    if (desc.includes('health') || desc.includes('medical') || desc.includes('insurance') || cat.includes('insurance')) {
      opportunities.healthInsurance.found = true;
      opportunities.healthInsurance.amount += t.amount;
      opportunities.healthInsurance.transactions.push(t);
    }
    
    // Life Insurance (80C)
    if (desc.includes('lic') || desc.includes('life insurance') || desc.includes('policy')) {
      opportunities.lifeInsurance.found = true;
      opportunities.lifeInsurance.amount += t.amount;
      opportunities.lifeInsurance.transactions.push(t);
    }
    
    // Mutual Funds/ELSS (80C)
    if (desc.includes('mutual fund') || desc.includes('elss') || desc.includes('sip')) {
      opportunities.mutualFunds.found = true;
      opportunities.mutualFunds.amount += t.amount;
      opportunities.mutualFunds.transactions.push(t);
    }
    
    // PPF (80C)
    if (desc.includes('ppf') || desc.includes('public provident')) {
      opportunities.ppf.found = true;
      opportunities.ppf.amount += t.amount;
      opportunities.ppf.transactions.push(t);
    }
    
    // NPS (80CCD)
    if (desc.includes('nps') || desc.includes('pension')) {
      opportunities.nps.found = true;
      opportunities.nps.amount += t.amount;
      opportunities.nps.transactions.push(t);
    }
    
    // Rent (HRA)
    if (cat.includes('rent') || desc.includes('rent')) {
      opportunities.rent.found = true;
      opportunities.rent.amount += t.amount;
      opportunities.rent.transactions.push(t);
    }
    
    // Home Loan (24b)
    if (desc.includes('home loan') || desc.includes('housing loan') || desc.includes('emi')) {
      opportunities.homeLoan.found = true;
      opportunities.homeLoan.amount += t.amount;
      opportunities.homeLoan.transactions.push(t);
    }
    
    // Education Loan (80E)
    if (desc.includes('education loan') || desc.includes('student loan')) {
      opportunities.educationLoan.found = true;
      opportunities.educationLoan.amount += t.amount;
      opportunities.educationLoan.transactions.push(t);
    }
    
    // Donations (80G)
    if (cat.includes('donation') || desc.includes('donation') || desc.includes('charity')) {
      opportunities.donations.found = true;
      opportunities.donations.amount += t.amount;
      opportunities.donations.transactions.push(t);
    }
  });

  return opportunities;
}

/**
 * Generate AI-powered tax insights based on transactions and profile
 */
async function generateAITaxInsights(userId, userName = 'User') {
  try {
    const user = await User.findById(userId);
    if (!user || !user.onboardingCompleted) {
      return { insights: [], needsOnboarding: true };
    }

    // Get tax opportunities from transactions
    const opportunities = await analyzeTaxOpportunities(userId);
    
    // Calculate current tax liability
    const oldRegimeCalc = calculateTaxLiability(user.profile, { ...user.taxProfile, taxRegime: 'old' });
    const newRegimeCalc = calculateTaxLiability(user.profile, { ...user.taxProfile, taxRegime: 'new' });
    
    // Get user memory for context
    const userMemory = await UserMemory.getOrCreate(userId);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `You are DhanSarthi's Tax AI Agent - a proactive, intelligent tax advisor for young Indians.

USER PROFILE:
- Name: ${userName}
- Annual Income: ₹${user.profile.annualIncome?.toLocaleString('en-IN')}
- Profession: ${user.profile.profession}
- Age: ${user.profile.age}
- City: ${user.profile.city} (${user.profile.cityType})

CURRENT TAX SITUATION:
- Old Regime Tax: ₹${oldRegimeCalc.taxLiability?.toLocaleString('en-IN')}
- New Regime Tax: ₹${newRegimeCalc.taxLiability?.toLocaleString('en-IN')}
- Current Deductions: ₹${oldRegimeCalc.totalDeductions?.toLocaleString('en-IN')}

TAX-SAVING OPPORTUNITIES DETECTED FROM TRANSACTIONS:
${opportunities.healthInsurance.found ? `✅ Health Insurance: ₹${opportunities.healthInsurance.amount.toLocaleString('en-IN')} spent` : '❌ No health insurance detected'}
${opportunities.lifeInsurance.found ? `✅ Life Insurance: ₹${opportunities.lifeInsurance.amount.toLocaleString('en-IN')} spent` : '❌ No life insurance detected'}
${opportunities.mutualFunds.found ? `✅ Mutual Funds/ELSS: ₹${opportunities.mutualFunds.amount.toLocaleString('en-IN')} invested` : '❌ No ELSS investments detected'}
${opportunities.ppf.found ? `✅ PPF: ₹${opportunities.ppf.amount.toLocaleString('en-IN')} invested` : '❌ No PPF contributions detected'}
${opportunities.rent.found ? `✅ Rent Payments: ₹${opportunities.rent.amount.toLocaleString('en-IN')} paid` : '❌ No rent payments detected'}
${opportunities.homeLoan.found ? `✅ Home Loan: ₹${opportunities.homeLoan.amount.toLocaleString('en-IN')} paid` : ''}
${opportunities.donations.found ? `✅ Donations: ₹${opportunities.donations.amount.toLocaleString('en-IN')} donated` : ''}

TASK: Generate 4-5 SPECIFIC, ACTIONABLE tax-saving insights:
1. Analyze what they're ALREADY doing right (based on detected transactions)
2. Identify MISSED opportunities (what they should be doing but aren't)
3. Calculate EXACT potential savings for each suggestion
4. Provide SPECIFIC next steps with deadlines
5. Be encouraging and conversational

Format as JSON array:
[
  {
    "type": "success" | "opportunity" | "warning" | "action",
    "title": "Short catchy title",
    "message": "2-3 sentence explanation with specific numbers",
    "potentialSaving": number,
    "action": "Specific next step",
    "deadline": "YYYY-MM-DD" or null,
    "priority": "high" | "medium" | "low"
  }
]

Return ONLY valid JSON, no markdown.`;

    const result = await retryWithBackoff(async () => {
      return await model.generateContent(prompt);
    });
    
    let aiResponse = result.response.text().trim();
    
    // Clean up markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const insights = JSON.parse(aiResponse);

    return {
      insights,
      opportunities,
      taxComparison: {
        oldRegime: oldRegimeCalc.taxLiability,
        newRegime: newRegimeCalc.taxLiability,
        recommended: oldRegimeCalc.taxLiability < newRegimeCalc.taxLiability ? 'old' : 'new',
        savings: Math.abs(oldRegimeCalc.taxLiability - newRegimeCalc.taxLiability)
      }
    };

  } catch (error) {
    console.error('AI Tax Insights Error:', error);
    throw new Error('Failed to generate AI tax insights: ' + error.message);
  }
}

/**
 * Chat with Tax AI Agent
 */
async function chatWithTaxAI(userId, userMessage, userName = 'User') {
  try {
    const user = await User.findById(userId);
    if (!user || !user.onboardingCompleted) {
      return {
        response: "I'd love to help with your tax questions! But first, please complete your profile so I can give you personalized advice.",
        needsOnboarding: true
      };
    }

    // Get context
    const opportunities = await analyzeTaxOpportunities(userId);
    const oldRegimeCalc = calculateTaxLiability(user.profile, { ...user.taxProfile, taxRegime: 'old' });
    const newRegimeCalc = calculateTaxLiability(user.profile, { ...user.taxProfile, taxRegime: 'new' });

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const systemContext = `You are DhanSarthi's Tax AI - a friendly, knowledgeable tax advisor for young Indians.

USER: ${userName}
Income: ₹${user.profile.annualIncome?.toLocaleString('en-IN')}/year
Profession: ${user.profile.profession}
Age: ${user.profile.age}

TAX SITUATION:
- Old Regime: ₹${oldRegimeCalc.taxLiability?.toLocaleString('en-IN')} tax
- New Regime: ₹${newRegimeCalc.taxLiability?.toLocaleString('en-IN')} tax
- Current Deductions: ₹${oldRegimeCalc.totalDeductions?.toLocaleString('en-IN')}

DETECTED FROM TRANSACTIONS:
- Health Insurance: ${opportunities.healthInsurance.found ? '₹' + opportunities.healthInsurance.amount.toLocaleString('en-IN') : 'None'}
- Investments (80C): ${opportunities.mutualFunds.found || opportunities.ppf.found ? 'Yes' : 'None'}
- Rent Payments: ${opportunities.rent.found ? '₹' + opportunities.rent.amount.toLocaleString('en-IN') : 'None'}

RULES:
- Be conversational and friendly
- Use Indian Rupees (₹)
- Give specific, actionable advice
- Reference their actual data
- Keep responses under 150 words
- Be encouraging

User's question: ${userMessage}`;

    const result = await retryWithBackoff(async () => {
      return await model.generateContent(systemContext);
    });

    return {
      response: result.response.text(),
      context: {
        oldRegimeTax: oldRegimeCalc.taxLiability,
        newRegimeTax: newRegimeCalc.taxLiability,
        deductions: oldRegimeCalc.totalDeductions
      }
    };

  } catch (error) {
    console.error('Tax AI Chat Error:', error);
    throw new Error('Failed to chat with Tax AI: ' + error.message);
  }
}

/**
 * Generate smart tax reminders based on time of year
 */
function generateSmartReminders(userProfile, taxProfile) {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const reminders = [];

  // Q3 Advance Tax (Dec 15)
  if (month === 11 || month === 12) {
    reminders.push({
      type: 'deadline',
      title: '⚠️ Advance Tax Due Soon',
      message: 'Q3 advance tax payment due on December 15th. Calculate and pay to avoid penalties.',
      deadline: `${now.getFullYear()}-12-15`,
      priority: 'high'
    });
  }

  // Year-end tax planning (Jan-Mar)
  if (month >= 1 && month <= 3) {
    reminders.push({
      type: 'action',
      title: '🎯 Last Chance for Tax Savings',
      message: 'Financial year ends March 31st. Complete your 80C investments, pay insurance premiums, and claim all deductions!',
      deadline: `${now.getFullYear()}-03-31`,
      priority: 'high'
    });
  }

  // ITR filing season (Apr-Jul)
  if (month >= 4 && month <= 7) {
    reminders.push({
      type: 'deadline',
      title: '📝 File Your ITR',
      message: 'ITR filing deadline is July 31st. Gather your Form 16, investment proofs, and file your return.',
      deadline: `${now.getFullYear()}-07-31`,
      priority: 'high'
    });
  }

  return reminders;
}

module.exports = {
  analyzeTaxOpportunities,
  generateAITaxInsights,
  chatWithTaxAI,
  generateSmartReminders
};
