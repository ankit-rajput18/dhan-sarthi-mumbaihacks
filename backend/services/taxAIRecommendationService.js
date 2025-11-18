const { GoogleGenerativeAI } = require('@google/generative-ai');
const TaxRecommendation = require('../models/TaxRecommendation');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const Loan = require('../models/Loan');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate fallback recommendation based on rules
 */
function generateFallbackRecommendation(context) {
  const { profile, tax, financial } = context;
  
  // Collect all applicable recommendations
  const recommendations = [];
  
  // Rule 1: Low 80C utilization
  if (tax.total80C < 100000 && financial.monthlySavings > 5000) {
    const gap = 150000 - tax.total80C;
    const monthlySuggestion = Math.min(Math.floor(financial.monthlySavings * 0.3), Math.floor(gap / 6));
    const potentialSaving = Math.floor(gap * 0.312);
    
    recommendations.push({
      recommendation: `You're only using ₹${tax.total80C.toLocaleString('en-IN')} of your ₹1,50,000 Section 80C limit. Consider investing ₹${monthlySuggestion.toLocaleString('en-IN')}/month in ELSS mutual funds to save up to ₹${potentialSaving.toLocaleString('en-IN')} in taxes while building wealth.`,
      category: '80C',
      potentialSaving,
      priority: 'high',
      actionSteps: [
        `Start a monthly SIP of ₹${monthlySuggestion.toLocaleString('en-IN')} in ELSS funds`,
        'Choose funds with good 5-year track record',
        'Set up auto-debit for hassle-free investing'
      ]
    });
    
    // Alternative 80C recommendation
    recommendations.push({
      recommendation: `Maximize your Section 80C deduction! You have ₹${gap.toLocaleString('en-IN')} unused limit. Consider PPF (safe, 7.1% returns) or NPS (additional ₹50,000 deduction under 80CCD) to reduce your tax burden by ₹${potentialSaving.toLocaleString('en-IN')}.`,
      category: '80C',
      potentialSaving,
      priority: 'high',
      actionSteps: [
        'Open a PPF account if you prefer safe investments',
        'Consider NPS for retirement planning with extra tax benefits',
        'Diversify between ELSS, PPF, and NPS for optimal returns'
      ]
    });
  }
  
  // Rule 2: Health insurance (80D)
  if (!tax.hasHealthInsurance || tax.healthInsurancePremium < 25000) {
    const currentPremium = tax.healthInsurancePremium || 0;
    const maxDeduction = profile.age >= 60 ? 50000 : 25000;
    const gap = maxDeduction - currentPremium;
    const potentialSaving = Math.floor(gap * 0.312);
    
    recommendations.push({
      recommendation: `Boost your health coverage and save taxes! You can claim up to ₹${maxDeduction.toLocaleString('en-IN')} under Section 80D. Increasing your health insurance premium by ₹${gap.toLocaleString('en-IN')} could save you ₹${potentialSaving.toLocaleString('en-IN')} in taxes.`,
      category: '80D',
      potentialSaving,
      priority: 'high',
      actionSteps: [
        'Compare health insurance plans with adequate coverage',
        'Consider family floater plans for better value',
        'Add parents to get additional ₹50,000 deduction'
      ]
    });
  }
  
  // Rule 3: Paying rent (HRA)
  if (tax.payingRent && tax.monthlyRent > 0 && tax.regime === 'old') {
    const annualRent = tax.monthlyRent * 12;
    const potentialSaving = Math.floor(annualRent * 0.3 * 0.312);
    
    recommendations.push({
      recommendation: `You're paying ₹${tax.monthlyRent.toLocaleString('en-IN')}/month rent. Ensure you're claiming HRA deduction by submitting rent receipts to your employer to save approximately ₹${potentialSaving.toLocaleString('en-IN')} in taxes.`,
      category: 'HRA',
      potentialSaving,
      priority: 'high',
      actionSteps: [
        'Get rent receipts from your landlord',
        'Submit to your HR department',
        'Verify HRA is reflected in Form 16'
      ]
    });
  }
  
  // Rule 4: Home loan interest
  if (tax.hasHomeLoan && tax.homeLoanInterest > 0) {
    const potentialSaving = Math.floor(Math.min(tax.homeLoanInterest, 200000) * 0.312);
    
    recommendations.push({
      recommendation: `You're paying home loan interest of ₹${tax.homeLoanInterest.toLocaleString('en-IN')}. Claim deduction under Section 24(b) (up to ₹2 lakhs) to save ₹${potentialSaving.toLocaleString('en-IN')} in taxes. Also claim principal repayment under 80C!`,
      category: 'home_loan',
      potentialSaving,
      priority: 'medium',
      actionSteps: [
        'Get home loan interest certificate from bank',
        'Claim interest under Section 24(b)',
        'Claim principal repayment under Section 80C'
      ]
    });
  }
  
  // Rule 5: New regime optimization
  if (tax.regime === 'new' && tax.total80C < 50000) {
    recommendations.push({
      recommendation: `You're on the new tax regime with minimal deductions. This is optimal for you! Focus on building an emergency fund and investing for long-term goals without worrying about tax-saving instruments.`,
      category: 'general',
      potentialSaving: 0,
      priority: 'low',
      actionSteps: [
        'Build 6-month emergency fund',
        'Invest surplus in diversified mutual funds',
        'Review regime choice annually'
      ]
    });
  }
  
  // Rule 6: NPS additional benefit
  if (tax.regime === 'old' && financial.monthlySavings > 4000) {
    const npsContribution = Math.min(50000, financial.monthlySavings * 12 * 0.1);
    const potentialSaving = Math.floor(npsContribution * 0.312);
    
    recommendations.push({
      recommendation: `Unlock extra tax savings with NPS! Beyond the ₹1.5L limit under 80C, you can claim an additional ₹50,000 under Section 80CCD(1B). Investing ₹${Math.floor(npsContribution/12).toLocaleString('en-IN')}/month in NPS could save you ₹${potentialSaving.toLocaleString('en-IN')} more in taxes.`,
      category: 'investment',
      potentialSaving,
      priority: 'medium',
      actionSteps: [
        'Open NPS account through bank or online',
        'Choose investment mix based on your age',
        'Set up auto-debit for monthly contributions'
      ]
    });
  }
  
  // Universal recommendations (always applicable)
  
  // Emergency fund
  recommendations.push({
    recommendation: `Build a solid financial foundation! Aim for 6 months of expenses (₹${Math.floor(financial.yearExpenses / 2).toLocaleString('en-IN')}) in an emergency fund. Keep it in a liquid fund or high-interest savings account for easy access during emergencies.`,
    category: 'general',
    potentialSaving: 0,
    priority: 'high',
    actionSteps: [
      'Calculate your monthly expenses',
      'Open a separate savings account for emergency fund',
      'Set up automatic monthly transfers'
    ]
  });
  
  // Investment diversification
  recommendations.push({
    recommendation: `Diversify your investments for better returns! With your income of ₹${profile.annualIncome.toLocaleString('en-IN')}, consider allocating 60% to equity mutual funds, 30% to debt funds, and 10% to gold for a balanced portfolio.`,
    category: 'investment',
    potentialSaving: 0,
    priority: 'medium',
    actionSteps: [
      'Start SIPs in 2-3 diversified equity mutual funds',
      'Invest in debt funds for stability',
      'Consider gold ETFs for portfolio diversification'
    ]
  });
  
  // Tax planning timing
  recommendations.push({
    recommendation: `Don't wait until March! Start tax planning now to avoid last-minute rush. Spread your investments throughout the year for better returns and disciplined saving habits.`,
    category: 'general',
    potentialSaving: 0,
    priority: 'medium',
    actionSteps: [
      'Review your tax-saving investments quarterly',
      'Set up monthly SIPs instead of lump sum',
      'Track your deductions using a spreadsheet'
    ]
  });
  
  // Digital tax filing
  recommendations.push({
    recommendation: `Go digital with your tax filing! Use the new income tax portal to file returns online, track refunds, and download Form 16. It's faster, easier, and you get instant acknowledgment.`,
    category: 'general',
    potentialSaving: 0,
    priority: 'low',
    actionSteps: [
      'Register on incometax.gov.in if not done',
      'Link PAN with Aadhaar',
      'Download previous year returns for reference'
    ]
  });
  
  // Retirement planning
  if (profile.age < 40) {
    recommendations.push({
      recommendation: `Start retirement planning early! At ${profile.age} years, you have time on your side. Investing just ₹5,000/month in equity funds can grow to ₹1+ crore by retirement through the power of compounding.`,
      category: 'investment',
      potentialSaving: 0,
      priority: 'medium',
      actionSteps: [
        'Calculate your retirement corpus needed',
        'Start a dedicated retirement fund SIP',
        'Review and increase contributions annually'
      ]
    });
  }
  
  // Tax regime review
  recommendations.push({
    recommendation: `Review your tax regime choice annually! Your financial situation changes - what's optimal today might not be tomorrow. Compare both regimes each year before filing returns.`,
    category: 'regime_switch',
    potentialSaving: 0,
    priority: 'low',
    actionSteps: [
      'Calculate tax under both regimes',
      'Consider your investment plans',
      'Choose regime before filing ITR'
    ]
  });
  
  // Default fallback
  recommendations.push({
    recommendation: `Based on your income of ₹${profile.annualIncome.toLocaleString('en-IN')}, focus on maximizing tax-efficient investments. Consider ELSS for 80C benefits and health insurance for 80D deductions to optimize your tax liability.`,
    category: 'general',
    potentialSaving: 15000,
    priority: 'medium',
    actionSteps: [
      'Review your current 80C investments',
      'Consider health insurance for family',
      'Consult a tax advisor for personalized advice'
    ]
  });
  
  // Randomly select one recommendation
  const selectedRec = recommendations[Math.floor(Math.random() * recommendations.length)];
  
  return {
    ...selectedRec,
    createdAt: new Date()
  };
}

/**
 * Generate AI-powered tax recommendation
 */
async function generateTaxRecommendation(userId) {
  try {
    // Fetch user data
    const user = await User.findById(userId).select('profile taxProfile');
    if (!user) {
      throw new Error('User not found');
    }

    // Fetch financial data
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    const [yearTransactions, goals, loans] = await Promise.all([
      Transaction.find({ user: userId, date: { $gte: startOfYear } }).lean(),
      Goal.find({ user: userId, status: 'active' }).lean(),
      Loan.find({ user: userId, status: 'active' }).lean()
    ]);

    // Calculate financial metrics
    const yearIncome = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearExpenses = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEMI = loans.reduce((sum, l) => sum + (l.emiAmount || 0), 0);
    const totalGoalAllocations = goals.reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);

    // Calculate current 80C investments
    const current80C = user.taxProfile?.investments80C || {};
    const total80C = Object.values(current80C).reduce((sum, val) => sum + (val || 0), 0);

    // Build context for AI
    const context = {
      profile: {
        age: user.profile?.age,
        profession: user.profile?.profession,
        monthlyIncome: user.profile?.monthlyIncome || 0,
        annualIncome: user.profile?.annualIncome || 0,
        city: user.profile?.city,
        cityType: user.profile?.cityType
      },
      tax: {
        regime: user.taxProfile?.taxRegime || 'new',
        payingRent: user.taxProfile?.payingRent,
        monthlyRent: user.taxProfile?.monthlyRent || 0,
        hasHealthInsurance: user.taxProfile?.hasHealthInsurance,
        healthInsurancePremium: user.taxProfile?.healthInsurancePremium || 0,
        hasHomeLoan: user.taxProfile?.hasHomeLoan,
        homeLoanEMI: user.taxProfile?.homeLoanEMI || 0,
        hasEducationLoan: user.taxProfile?.hasEducationLoan,
        investments80C: current80C,
        total80C
      },
      financial: {
        yearIncome,
        yearExpenses,
        monthlySavings: (yearIncome - yearExpenses) / (now.getMonth() + 1),
        totalEMI,
        totalGoalAllocations,
        hasLoans: loans.length > 0,
        hasGoals: goals.length > 0,
        activeGoals: goals.length,
        activeLoans: loans.length
      }
    };

    // Create AI prompt
    const prompt = `You are a tax advisor for Indian taxpayers. Generate ONE specific, actionable tax-saving recommendation.

USER PROFILE:
- Age: ${context.profile.age} years
- Profession: ${context.profile.profession}
- Monthly Income: ₹${context.profile.monthlyIncome?.toLocaleString()}
- Annual Income: ₹${context.profile.annualIncome?.toLocaleString()}
- Location: ${context.profile.city} (${context.profile.cityType})

TAX SITUATION:
- Current Regime: ${context.tax.regime}
- Paying Rent: ${context.tax.payingRent ? `Yes (₹${context.tax.monthlyRent?.toLocaleString()}/month)` : 'No'}
- Health Insurance: ${context.tax.hasHealthInsurance ? `Yes (₹${context.tax.healthInsurancePremium?.toLocaleString()}/year)` : 'No'}
- Home Loan: ${context.tax.hasHomeLoan ? `Yes (₹${context.tax.homeLoanEMI?.toLocaleString()}/month EMI)` : 'No'}
- Education Loan: ${context.tax.hasEducationLoan ? 'Yes' : 'No'}
- Current 80C Investments: ₹${context.tax.total80C?.toLocaleString()} / ₹1,50,000
${Object.keys(context.tax.investments80C).length > 0 ? `  Breakdown: ${Object.entries(context.tax.investments80C).filter(([k,v]) => v > 0).map(([k,v]) => `${k.toUpperCase()} ₹${v.toLocaleString()}`).join(', ')}` : ''}

FINANCIAL SITUATION:
- YTD Income: ₹${context.financial.yearIncome?.toLocaleString()}
- YTD Expenses: ₹${context.financial.yearExpenses?.toLocaleString()}
- Monthly Savings: ₹${Math.round(context.financial.monthlySavings)?.toLocaleString()}
- Monthly EMI: ₹${context.financial.totalEMI?.toLocaleString()}
- Active Goals: ${context.financial.activeGoals}
- Active Loans: ${context.financial.activeLoans}

Generate ONE specific tax-saving recommendation considering:
- Current tax regime and if switching makes sense
- Unused deduction limits (80C, 80D, HRA, home loan)
- Savings capacity and commitments
- Practical steps they can take now

Respond ONLY with valid JSON in this exact format:
{
  "recommendation": "Your specific recommendation in 2-3 sentences",
  "category": "80C",
  "potentialSaving": 15000,
  "priority": "high",
  "actionSteps": ["Step 1", "Step 2", "Step 3"]
}

Category must be one of: 80C, 80D, HRA, home_loan, regime_switch, investment, deduction, general
Priority must be: high, medium, or low`;

    // Generate recommendation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Check if response was blocked
    if (!response || !response.text || response.text().trim() === '') {
      
      // Provide a fallback recommendation based on data
      const fallbackData = generateFallbackRecommendation(context);
      
      // Save fallback to database
      const recommendation = await TaxRecommendation.create({
        user: userId,
        recommendation: fallbackData.recommendation,
        category: fallbackData.category,
        potentialSaving: fallbackData.potentialSaving,
        priority: fallbackData.priority,
        actionable: true,
        metadata: {
          basedOn: {
            income: context.profile.annualIncome,
            currentDeductions: context.tax.total80C,
            regime: context.tax.regime,
            hasLoans: context.financial.hasLoans,
            hasGoals: context.financial.hasGoals
          },
          actionSteps: fallbackData.actionSteps,
          usedFallback: true
        }
      });

      await TaxRecommendation.cleanupOld(userId);

      return {
        recommendation: recommendation.recommendation,
        category: recommendation.category,
        potentialSaving: recommendation.potentialSaving,
        priority: recommendation.priority,
        actionSteps: fallbackData.actionSteps,
        createdAt: recommendation.createdAt
      };
    }
    
    let responseText = response.text();
    
    // Clean up response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse AI response
    let aiResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      
      // Use fallback and save to database
      const fallbackData = generateFallbackRecommendation(context);
      
      const recommendation = await TaxRecommendation.create({
        user: userId,
        recommendation: fallbackData.recommendation,
        category: fallbackData.category,
        potentialSaving: fallbackData.potentialSaving,
        priority: fallbackData.priority,
        actionable: true,
        metadata: {
          basedOn: {
            income: context.profile.annualIncome,
            currentDeductions: context.tax.total80C,
            regime: context.tax.regime,
            hasLoans: context.financial.hasLoans,
            hasGoals: context.financial.hasGoals
          },
          actionSteps: fallbackData.actionSteps,
          usedFallback: true
        }
      });

      await TaxRecommendation.cleanupOld(userId);

      return {
        recommendation: recommendation.recommendation,
        category: recommendation.category,
        potentialSaving: recommendation.potentialSaving,
        priority: recommendation.priority,
        actionSteps: fallbackData.actionSteps,
        createdAt: recommendation.createdAt
      };
    }

    // Prepare recommendation data
    const recData = {
      recommendation: aiResponse.recommendation,
      category: aiResponse.category || 'general',
      potentialSaving: aiResponse.potentialSaving || 0,
      priority: aiResponse.priority || 'medium',
      actionSteps: aiResponse.actionSteps || []
    };

    // Save recommendation to database
    const recommendation = await TaxRecommendation.create({
      user: userId,
      recommendation: recData.recommendation,
      category: recData.category,
      potentialSaving: recData.potentialSaving,
      priority: recData.priority,
      actionable: true,
      metadata: {
        basedOn: {
          income: context.profile.annualIncome,
          currentDeductions: context.tax.total80C,
          regime: context.tax.regime,
          hasLoans: context.financial.hasLoans,
          hasGoals: context.financial.hasGoals
        },
        actionSteps: recData.actionSteps
      }
    });

    // Cleanup old recommendations
    await TaxRecommendation.cleanupOld(userId);

    return {
      recommendation: recommendation.recommendation,
      category: recommendation.category,
      potentialSaving: recommendation.potentialSaving,
      priority: recommendation.priority,
      actionSteps: recData.actionSteps,
      createdAt: recommendation.createdAt
    };

  } catch (error) {
    console.error('Error generating tax recommendation:', error);
    throw new Error('Failed to generate tax recommendation: ' + error.message);
  }
}

/**
 * Get latest tax recommendation for user
 */
async function getLatestRecommendation(userId) {
  try {
    const recommendation = await TaxRecommendation.getLatest(userId);
    
    if (!recommendation) {
      return null;
    }

    return {
      recommendation: recommendation.recommendation,
      category: recommendation.category,
      potentialSaving: recommendation.potentialSaving,
      priority: recommendation.priority,
      actionSteps: recommendation.metadata?.actionSteps || [],
      createdAt: recommendation.createdAt
    };
  } catch (error) {
    console.error('Error fetching latest recommendation:', error);
    throw error;
  }
}

module.exports = {
  generateTaxRecommendation,
  getLatestRecommendation
};
