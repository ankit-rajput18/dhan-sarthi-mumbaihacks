/**
 * Lending AI Service
 * Integrates lending context with AI recommendations
 */

const { 
  LENDING_TYPES, 
  PAYMENT_FREQUENCIES, 
  RISK_ASSESSMENT_FACTORS, 
  PREPAYMENT_CONSIDERATIONS,
  TAX_IMPLICATIONS,
  BEST_PRACTICES,
  LENDING_KPIS
} = require('./lendingAIContext');

const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');

/**
 * Generate AI-powered lending recommendations based on user profile and loans
 */
async function generateLendingRecommendations(userId) {
  try {
    // Get user and their loans
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const loans = await Loan.find({ user: userId, status: { $in: ['active', 'pending'] } });
    const transactions = await Transaction.find({ user: userId }).sort({ date: -1 }).limit(50);

    // Build lending context for AI
    const lendingContext = {
      userProfile: {
        income: user.income || 0,
        occupation: user.occupation || 'Not specified',
        financialGoals: user.financialGoals || [],
        riskTolerance: user.riskTolerance || 'moderate'
      },
      existingLoans: loans.map(loan => ({
        id: loan._id,
        type: loan.loanType,
        name: loan.loanName,
        principal: loan.principalAmount,
        interestRate: loan.interestRate,
        tenureMonths: loan.tenureMonths,
        emiAmount: loan.emiAmount,
        remainingBalance: loan.remainingBalance,
        nextEmiDate: loan.nextEmiDate,
        lender: loan.lender,
        startDate: loan.startDate,
        endDate: loan.endDate,
        status: loan.status,
        paymentFrequency: loan.paymentFrequency
      })),
      recentTransactions: transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        description: t.description
      }))
    };

    // Calculate key lending metrics
    const lendingMetrics = calculateLendingMetrics(lendingContext);

    // Generate recommendations
    const recommendations = [];

    // Debt-to-income ratio analysis
    if (lendingMetrics.debtToIncomeRatio > 40) {
      recommendations.push({
        type: 'debt_warning',
        priority: 'high',
        title: 'High Debt-to-Income Ratio',
        description: `Your monthly debt payments (${lendingMetrics.totalMonthlyDebt.toLocaleString()}) represent ${lendingMetrics.debtToIncomeRatio.toFixed(1)}% of your monthly income (${lendingMetrics.monthlyIncome.toLocaleString()}). This is above the recommended threshold of 40%.`,
        actions: [
          'Consider debt consolidation',
          'Avoid taking on new loans until debt levels decrease',
          'Look for ways to increase income'
        ]
      });
    }

    // Prepayment opportunities
    const prepaymentOpportunities = identifyPrepaymentOpportunities(loans, user.income);
    if (prepaymentOpportunities.length > 0) {
      recommendations.push({
        type: 'prepayment_opportunity',
        priority: 'medium',
        title: 'Prepayment Opportunities Available',
        description: 'You may benefit from prepaying certain loans to reduce total interest costs.',
        actions: prepaymentOpportunities
      });
    }

    // New loan recommendations
    const loanRecommendations = recommendLoanTypes(user, loans);
    if (loanRecommendations.length > 0) {
      recommendations.push({
        type: 'loan_recommendation',
        priority: 'low',
        title: 'Loan Product Recommendations',
        description: 'Based on your profile and financial situation, these loan products might be suitable:',
        actions: loanRecommendations
      });
    }

    // Tax optimization opportunities
    const taxOpportunities = identifyTaxOpportunities(loans, transactions);
    if (taxOpportunities.length > 0) {
      recommendations.push({
        type: 'tax_optimization',
        priority: 'medium',
        title: 'Tax Optimization Opportunities',
        description: 'You may be missing out on tax benefits related to your loans:',
        actions: taxOpportunities
      });
    }

    return {
      userProfile: lendingContext.userProfile,
      lendingMetrics,
      recommendations,
      lendingContext // For detailed AI analysis
    };
  } catch (error) {
    console.error('Error generating lending recommendations:', error);
    throw error;
  }
}

/**
 * Calculate key lending metrics for a user
 */
function calculateLendingMetrics(lendingContext) {
  const { userProfile, existingLoans } = lendingContext;
  
  // Monthly income (assuming annual income provided)
  const monthlyIncome = userProfile.income ? userProfile.income / 12 : 0;
  
  // Total monthly debt payments (EMIs)
  const totalMonthlyDebt = existingLoans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
  
  // Debt-to-income ratio
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0;
  
  // Total loan balance
  const totalLoanBalance = existingLoans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);
  
  // Total principal amount
  const totalPrincipal = existingLoans.reduce((sum, loan) => sum + (loan.principal || 0), 0);
  
  // Overall interest paid so far
  const totalInterestPaid = existingLoans.reduce((sum, loan) => sum + (loan.totalPaid - (loan.principal - loan.remainingBalance) || 0), 0);
  
  return {
    monthlyIncome,
    totalMonthlyDebt,
    debtToIncomeRatio,
    totalLoanBalance,
    totalPrincipal,
    totalInterestPaid,
    loanCount: existingLoans.length
  };
}

/**
 * Identify opportunities for loan prepayment
 */
function identifyPrepaymentOpportunities(loans, annualIncome) {
  const opportunities = [];
  const monthlyIncome = annualIncome / 12;
  
  loans.forEach(loan => {
    // High interest loans (>12%) are good prepayment candidates
    if (loan.interestRate > 12) {
      opportunities.push(`Consider prepaying your ${loan.loanName} (${loan.interestRate}% interest) to save on interest costs`);
    }
    
    // Personal loans with high interest relative to income
    if (loan.loanType === 'personal' && loan.interestRate > 15 && (loan.emiAmount / monthlyIncome) > 0.15) {
      opportunities.push(`Your ${loan.loanName} has a high interest rate and represents a significant portion of your income. Prepayment could improve your financial health.`);
    }
  });
  
  return opportunities;
}

/**
 * Recommend suitable loan types based on user profile
 */
function recommendLoanTypes(user, existingLoans) {
  const recommendations = [];
  
  // If user has financial goals, suggest relevant loans
  if (user.financialGoals && user.financialGoals.length > 0) {
    const existingLoanTypes = existingLoans.map(loan => loan.loanType);
    
    // Check for home goal without home loan
    if (user.financialGoals.includes('buying a house') && !existingLoanTypes.includes('home')) {
      recommendations.push('Consider a home loan for property purchase with potential tax benefits under Section 80C and 24B');
    }
    
    // Check for education goal without education loan
    if (user.financialGoals.includes('higher education') && !existingLoanTypes.includes('education')) {
      recommendations.push('An education loan might be suitable with tax benefits under Section 80E for interest deduction');
    }
    
    // Check for business goal without business loan
    if (user.financialGoals.includes('starting a business') && !existingLoanTypes.includes('business')) {
      recommendations.push('A business loan could provide the capital needed to start your venture');
    }
  }
  
  return recommendations;
}

/**
 * Identify tax optimization opportunities related to loans
 */
function identifyTaxOpportunities(loans, transactions) {
  const opportunities = [];
  
  // Check for home loans without claiming tax benefits
  const homeLoans = loans.filter(loan => loan.loanType === 'home');
  if (homeLoans.length > 0) {
    // Check if user is claiming home loan deductions
    const hasHomeLoanTransactions = transactions.some(t => 
      t.description.toLowerCase().includes('home loan') || 
      t.description.toLowerCase().includes('housing loan')
    );
    
    if (!hasHomeLoanTransactions) {
      opportunities.push('You have a home loan but may not be claiming tax deductions. You can claim up to ₹1.5 lakh on principal under Section 80C and up to ₹2 lakh on interest under Section 24B.');
    }
  }
  
  // Check for education loans without claiming tax benefits
  const educationLoans = loans.filter(loan => loan.loanType === 'education');
  if (educationLoans.length > 0) {
    // Check if user is claiming education loan deductions
    const hasEducationLoanTransactions = transactions.some(t => 
      t.description.toLowerCase().includes('education loan') || 
      t.description.toLowerCase().includes('student loan')
    );
    
    if (!hasEducationLoanTransactions) {
      opportunities.push('You have an education loan but may not be claiming tax benefits. Interest paid on education loans is fully deductible under Section 80E with no upper limit.');
    }
  }
  
  return opportunities;
}

/**
 * Generate personalized lending advice based on user context
 */
function generatePersonalizedLendingAdvice(lendingContext) {
  const advice = [];
  const { userProfile, existingLoans } = lendingContext;
  
  // Risk tolerance based advice
  if (userProfile.riskTolerance === 'low') {
    advice.push('Given your low risk tolerance, prioritize paying off high-interest debt before taking on new loans.');
  } else if (userProfile.riskTolerance === 'high') {
    advice.push('With your high risk tolerance, you might consider investment opportunities instead of prepaying low-interest loans.');
  }
  
  // Occupation based advice
  if (userProfile.occupation && userProfile.occupation.toLowerCase().includes('business')) {
    advice.push('As a business owner, consider business loans for growth opportunities and keep personal and business finances separate.');
  }
  
  // Loan diversity advice
  const loanTypes = [...new Set(existingLoans.map(loan => loan.type))];
  if (loanTypes.length > 3) {
    advice.push('You have loans across multiple categories. Consider consolidating similar loans to simplify management.');
  }
  
  return advice;
}

/**
 * Analyze loan portfolio health
 */
function analyzeLoanPortfolioHealth(loans) {
  const analysis = {
    totalLoans: loans.length,
    securedLoans: loans.filter(loan => ['home', 'car', 'gold'].includes(loan.loanType)).length,
    unsecuredLoans: loans.filter(loan => ['personal', 'education', 'business', 'other'].includes(loan.loanType)).length,
    averageInterestRate: loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length || 0,
    highestInterestLoan: loans.reduce((max, loan) => loan.interestRate > max.interestRate ? loan : max, { interestRate: 0 }),
    loanDistribution: {}
  };
  
  // Distribution by type
  loans.forEach(loan => {
    if (!analysis.loanDistribution[loan.loanType]) {
      analysis.loanDistribution[loan.loanType] = 0;
    }
    analysis.loanDistribution[loan.loanType]++;
  });
  
  return analysis;
}

module.exports = {
  generateLendingRecommendations,
  calculateLendingMetrics,
  identifyPrepaymentOpportunities,
  recommendLoanTypes,
  identifyTaxOpportunities,
  generatePersonalizedLendingAdvice,
  analyzeLoanPortfolioHealth,
  // Export context data for AI use
  LENDING_TYPES,
  PAYMENT_FREQUENCIES,
  RISK_ASSESSMENT_FACTORS,
  PREPAYMENT_CONSIDERATIONS,
  TAX_IMPLICATIONS,
  BEST_PRACTICES,
  LENDING_KPIS
};