// Tax calculation and optimization service

// FY 2024-25 Tax Slabs (New Regime)
const TAX_SLABS_NEW = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 700000, rate: 5 },
  { min: 700001, max: 1000000, rate: 10 },
  { min: 1000001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: Infinity, rate: 30 }
];

// FY 2024-25 Tax Slabs (Old Regime)
const TAX_SLABS_OLD = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: Infinity, rate: 30 }
];

// Calculate tax based on income and regime
function calculateTax(income, regime = 'new') {
  const slabs = regime === 'new' ? TAX_SLABS_NEW : TAX_SLABS_OLD;
  let tax = 0;
  
  for (const slab of slabs) {
    if (income > slab.min) {
      const taxableInThisSlab = Math.min(income, slab.max) - slab.min;
      tax += (taxableInThisSlab * slab.rate) / 100;
    }
  }
  
  // Add 4% cess
  tax = tax * 1.04;
  
  return Math.round(tax);
}

// Calculate total 80C deductions
function calculate80CTotal(investments) {
  const total = (investments.ppf || 0) + 
                (investments.elss || 0) + 
                (investments.lifeInsurance || 0) + 
                (investments.epf || 0) + 
                (investments.nps || 0);
  
  // 80C limit is 1.5L
  return Math.min(total, 150000);
}

// Calculate 80D (Health Insurance) deductions
function calculate80D(selfPremium, parentsPremium, age, parentsAge) {
  let selfLimit = age >= 60 ? 50000 : 25000;
  let parentsLimit = parentsAge >= 60 ? 50000 : 25000;
  
  const selfDeduction = Math.min(selfPremium || 0, selfLimit);
  const parentsDeduction = Math.min(parentsPremium || 0, parentsLimit);
  
  return selfDeduction + parentsDeduction;
}

// Calculate HRA exemption
function calculateHRA(salary, rentPaid, cityType) {
  if (!rentPaid || rentPaid === 0) return 0;
  
  const annualRent = rentPaid * 12;
  const tenPercentSalary = salary * 0.1;
  const rentMinusTenPercent = annualRent - tenPercentSalary;
  
  // 50% for metro, 40% for non-metro
  const salaryPercentage = cityType === 'metro' ? 0.5 : 0.4;
  const percentOfSalary = salary * salaryPercentage;
  
  // HRA exemption is minimum of these three
  const exemption = Math.min(rentMinusTenPercent, percentOfSalary, annualRent);
  
  return Math.max(0, Math.round(exemption));
}

// Calculate home loan deductions
function calculateHomeLoanDeduction(interest, principal) {
  // Section 24(b): Interest deduction up to 2L
  const interestDeduction = Math.min(interest || 0, 200000);
  
  // Section 80C: Principal repayment (part of 80C limit)
  const principalDeduction = Math.min(principal || 0, 150000);
  
  return { interestDeduction, principalDeduction };
}

// Main tax calculation with all deductions
function calculateTaxLiability(userProfile, taxProfile) {
  const annualIncome = userProfile.annualIncome || 0;
  const regime = taxProfile.taxRegime || 'new';
  
  // New regime doesn't allow most deductions
  if (regime === 'new') {
    const tax = calculateTax(annualIncome, 'new');
    return {
      grossIncome: annualIncome,
      totalDeductions: 0,
      taxableIncome: annualIncome,
      taxLiability: tax,
      regime: 'new',
      deductionBreakdown: {}
    };
  }
  
  // Old regime - calculate all deductions
  let deductions = {};
  
  // 80C deductions
  const deduction80C = calculate80CTotal(taxProfile.investments80C || {});
  deductions['80C'] = deduction80C;
  
  // 80D - Health Insurance
  const deduction80D = calculate80D(
    taxProfile.healthInsurancePremium,
    taxProfile.parentsHealthInsurance,
    userProfile.age,
    65 // Assume parents are senior citizens
  );
  deductions['80D'] = deduction80D;
  
  // HRA
  if (taxProfile.payingRent) {
    const hraExemption = calculateHRA(
      annualIncome,
      taxProfile.monthlyRent,
      userProfile.cityType
    );
    deductions['HRA'] = hraExemption;
  }
  
  // Home Loan
  if (taxProfile.hasHomeLoan) {
    const { interestDeduction } = calculateHomeLoanDeduction(
      taxProfile.homeLoanInterest,
      0 // Principal is part of 80C
    );
    deductions['24(b)'] = interestDeduction;
  }
  
  // Education Loan Interest (80E)
  if (taxProfile.hasEducationLoan) {
    deductions['80E'] = taxProfile.educationLoanInterest || 0;
  }
  
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
  const taxableIncome = Math.max(0, annualIncome - totalDeductions);
  const tax = calculateTax(taxableIncome, 'old');
  
  return {
    grossIncome: annualIncome,
    totalDeductions,
    taxableIncome,
    taxLiability: tax,
    regime: 'old',
    deductionBreakdown: deductions
  };
}

// Generate personalized tax tips
function generateTaxTips(userProfile, taxProfile, taxCalculation) {
  const tips = [];
  const annualIncome = userProfile.annualIncome || 0;
  const profession = userProfile.profession;
  
  // Check if user is below taxable limit
  if (annualIncome < 300000) {
    return [{
      id: 'below-tax-limit',
      category: 'info',
      title: '🎉 Great News! No Tax Liability',
      description: `Your annual income (₹${annualIncome.toLocaleString('en-IN')}) is below the taxable limit of ₹3,00,000. You don't need to pay income tax!`,
      priority: 'high',
      potentialSaving: 0,
      actionRequired: 'Focus on building savings and investments for future growth.',
      forProfession: ['student', 'salaried', 'freelancer', 'business']
    }];
  }
  
  // Student-specific tips
  if (profession === 'student') {
    return [{
      id: 'student-tips',
      category: 'info',
      title: '📚 Student Financial Tips',
      description: 'Build strong financial habits early! Track expenses, save regularly, and learn about investments.',
      priority: 'medium',
      potentialSaving: 0,
      actionRequired: 'Focus on learning and building an emergency fund. Tax planning will be relevant when you start earning ₹3L+ annually.',
      forProfession: ['student']
    }];
  }
  
  const regime = taxProfile.taxRegime || 'new';
  
  // 80C Investment Tips
  const current80C = calculate80CTotal(taxProfile.investments80C || {});
  if (regime === 'old' && current80C < 150000) {
    const remaining = 150000 - current80C;
    const potentialSaving = Math.round(remaining * 0.31); // 30% tax + 4% cess
    
    tips.push({
      id: '80c-investment',
      category: '80C',
      title: '💰 Maximize 80C Deductions',
      description: `You've used ₹${current80C.toLocaleString('en-IN')} of ₹1,50,000 limit. Invest ₹${remaining.toLocaleString('en-IN')} more to save taxes.`,
      priority: 'high',
      potentialSaving,
      actionRequired: `Invest in ELSS, PPF, or NPS before March 31st`,
      deadline: '2025-03-31'
    });
  }
  
  // Health Insurance Tips
  if (regime === 'old' && !taxProfile.hasHealthInsurance) {
    tips.push({
      id: 'health-insurance',
      category: '80D',
      title: '🏥 Get Health Insurance',
      description: 'Health insurance premiums are tax-deductible under Section 80D.',
      priority: 'high',
      potentialSaving: 7750, // 25000 * 31%
      actionRequired: 'Buy health insurance (₹25,000 deduction for self, ₹25,000 for parents)',
      deadline: '2025-03-31'
    });
  }
  
  // HRA Tips
  if (regime === 'old' && taxProfile.payingRent && taxProfile.monthlyRent > 0) {
    const hraExemption = calculateHRA(annualIncome, taxProfile.monthlyRent, userProfile.cityType);
    if (hraExemption > 0) {
      tips.push({
        id: 'hra-claim',
        category: 'HRA',
        title: '🏠 Claim HRA Exemption',
        description: `You're eligible for ₹${hraExemption.toLocaleString('en-IN')} HRA exemption.`,
        priority: 'medium',
        potentialSaving: Math.round(hraExemption * 0.31),
        actionRequired: 'Submit rent receipts and landlord details to your employer'
      });
    }
  } else if (regime === 'old' && !taxProfile.payingRent && annualIncome > 500000) {
    tips.push({
      id: 'hra-opportunity',
      category: 'HRA',
      title: '🏠 Consider HRA Benefits',
      description: 'If you pay rent, you can claim HRA exemption to reduce taxable income.',
      priority: 'low',
      potentialSaving: 0,
      actionRequired: 'Update your profile if you pay rent'
    });
  }
  
  // Home Loan Tips
  if (regime === 'old' && taxProfile.hasHomeLoan) {
    const interest = taxProfile.homeLoanInterest || 0;
    if (interest > 0) {
      const deduction = Math.min(interest, 200000);
      tips.push({
        id: 'home-loan',
        category: '24(b)',
        title: '🏡 Home Loan Interest Deduction',
        description: `Claim ₹${deduction.toLocaleString('en-IN')} as home loan interest deduction.`,
        priority: 'medium',
        potentialSaving: Math.round(deduction * 0.31),
        actionRequired: 'Get interest certificate from your bank'
      });
    }
  }
  
  // Regime Comparison Tip
  if (regime === 'new' && annualIncome > 700000) {
    tips.push({
      id: 'regime-comparison',
      category: 'info',
      title: '🔄 Compare Tax Regimes',
      description: 'You might save more with the old regime if you have deductions.',
      priority: 'medium',
      potentialSaving: 0,
      actionRequired: 'Use our tax calculator to compare both regimes'
    });
  }
  
  // Freelancer-specific tips
  if (profession === 'freelancer') {
    tips.push({
      id: 'advance-tax',
      category: 'info',
      title: '⚠️ Advance Tax Reminder',
      description: 'Freelancers must pay advance tax quarterly to avoid penalties.',
      priority: 'high',
      potentialSaving: 0,
      actionRequired: 'Next advance tax due: 15th December 2024',
      deadline: '2024-12-15'
    });
    
    tips.push({
      id: 'business-expenses',
      category: 'info',
      title: '💼 Claim Business Expenses',
      description: 'You can claim 30-50% of income as business expenses (Section 44ADA).',
      priority: 'medium',
      potentialSaving: Math.round(annualIncome * 0.3 * 0.31),
      actionRequired: 'Maintain proper records of business expenses'
    });
  }
  
  return tips;
}

module.exports = {
  calculateTax,
  calculateTaxLiability,
  generateTaxTips,
  calculate80CTotal,
  calculate80D,
  calculateHRA
};
