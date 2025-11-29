/**
 * AI Context Service for Lending Features
 * Provides structured information about lending functionality for AI processing
 */

// Lending Types and Their Characteristics
const LENDING_TYPES = {
  personal: {
    name: "Personal Loan",
    typicalInterestRate: "10-20%",
    typicalTenure: "1-5 years",
    commonUseCases: ["Medical emergencies", "Weddings", "Home renovations", "Debt consolidation"],
    riskProfile: "Unsecured, higher risk for lender"
  },
  home: {
    name: "Home Loan",
    typicalInterestRate: "6-10%",
    typicalTenure: "5-30 years",
    commonUseCases: ["Property purchase", "Construction", "Renovation"],
    taxBenefits: "Section 80C and 24B deductions available",
    riskProfile: "Secured against property, lower risk"
  },
  car: {
    name: "Car Loan",
    typicalInterestRate: "8-12%",
    typicalTenure: "1-7 years",
    commonUseCases: ["New car purchase", "Used car purchase"],
    riskProfile: "Secured against vehicle, moderate risk"
  },
  education: {
    name: "Education Loan",
    typicalInterestRate: "9-14%",
    typicalTenure: "5-15 years",
    commonUseCases: ["Tuition fees", "Living expenses", "Books and equipment"],
    taxBenefits: "Section 80E deduction on interest component",
    riskProfile: "May be secured or unsecured"
  },
  business: {
    name: "Business Loan",
    typicalInterestRate: "12-20%",
    typicalTenure: "1-10 years",
    commonUseCases: ["Startup capital", "Equipment purchase", "Working capital"],
    riskProfile: "Secured or unsecured, varies by business type"
  },
  gold: {
    name: "Gold Loan",
    typicalInterestRate: "9-18%",
    typicalTenure: "6 months - 3 years",
    commonUseCases: ["Short-term financing", "Emergency funds"],
    riskProfile: "Secured against gold assets, low risk for lender"
  },
  other: {
    name: "Other Loan",
    typicalInterestRate: "Variable",
    typicalTenure: "Variable",
    commonUseCases: ["Travel", "Electronics purchase", "Investment"],
    riskProfile: "Depends on specifics"
  }
};

// Payment Frequency Options
const PAYMENT_FREQUENCIES = {
  monthly: {
    description: "Equal Monthly Installments (EMI)",
    typicalFor: ["Most common for all loan types"],
    benefits: ["Predictable payments", "Easy budgeting"]
  },
  quarterly: {
    description: "Payments every 3 months",
    typicalFor: ["Some business loans", "Large personal loans"],
    benefits: ["Lower administrative burden", "Reduced payment frequency"]
  },
  yearly: {
    description: "Annual payments",
    typicalFor: ["Specific business arrangements", "Investment loans"],
    benefits: ["Minimal payment management", "Suitable for annual income flows"]
  }
};

// Loan Risk Assessment Factors
const RISK_ASSESSMENT_FACTORS = {
  incomeRatio: {
    lowRisk: "< 20% of monthly income",
    moderateRisk: "20-35% of monthly income",
    highRisk: "> 35% of monthly income",
    description: "EMI to income ratio is a key risk indicator"
  },
  creditScore: {
    excellent: "750+",
    good: "700-749",
    fair: "650-699",
    poor: "< 650",
    description: "Credit score affects loan approval and interest rates"
  },
  loanType: {
    secured: ["home", "car", "gold"],
    unsecured: ["personal", "education", "business", "other"],
    description: "Secured loans have collateral, reducing lender risk"
  }
};

// Prepayment Considerations
const PREPAYMENT_CONSIDERATIONS = {
  benefits: [
    "Reduced total interest paid",
    "Early debt freedom",
    "Improved debt-to-income ratio"
  ],
  costs: [
    "Prepayment charges (typically 2-5%)",
    "Opportunity cost of alternative investments"
  ],
  timing: {
    early: "Higher interest savings but higher prepayment penalties",
    late: "Lower interest savings but lower prepayment penalties"
  }
};

// Tax Implications
const TAX_IMPLICATIONS = {
  deductions: {
    section80C: {
      applicableTo: ["home loan principal"],
      limit: "Up to ₹1.5 lakh",
      description: "Principal repayment eligible for deduction"
    },
    section80E: {
      applicableTo: ["education loan interest"],
      limit: "No upper limit",
      duration: "Maximum 8 years",
      description: "Interest component fully deductible"
    },
    section24B: {
      applicableTo: ["home loan interest"],
      limit: "Up to ₹2 lakh (self-occupied property)",
      description: "Interest repayment deduction"
    }
  }
};

// Lending Best Practices
const BEST_PRACTICES = {
  beforeTakingLoan: [
    "Compare interest rates from multiple lenders",
    "Calculate total cost including processing fees",
    "Understand prepayment policies",
    "Check eligibility criteria thoroughly"
  ],
  duringLoanPeriod: [
    "Pay EMIs on time to maintain credit score",
    "Consider prepayment when interest rates drop",
    "Maintain insurance coverage for secured loans",
    "Review statements regularly for accuracy"
  ],
  loanManagement: [
    "Use automated payments to avoid defaults",
    "Keep emergency fund separate from loan prepayments",
    "Track tax benefits for eligible loans",
    "Plan for major life changes affecting repayment capacity"
  ]
};

// Lending KPIs (Key Performance Indicators)
const LENDING_KPIS = {
  emiToIncomeRatio: {
    formula: "(Monthly EMI / Gross Monthly Income) × 100",
    healthyRange: "< 20%",
    cautionRange: "20-35%",
    dangerRange: "> 35%"
  },
  loanToValueRatio: {
    formula: "(Loan Amount / Asset Value) × 100",
    description: "Primarily for secured loans",
    healthyRange: "< 80%",
    cautionRange: "80-90%",
    dangerRange: "> 90%"
  },
  debtToIncomeRatio: {
    formula: "(Total Monthly Debt Payments / Gross Monthly Income) × 100",
    healthyRange: "< 36%",
    cautionRange: "36-43%",
    dangerRange: "> 43%"
  }
};

module.exports = {
  LENDING_TYPES,
  PAYMENT_FREQUENCIES,
  RISK_ASSESSMENT_FACTORS,
  PREPAYMENT_CONSIDERATIONS,
  TAX_IMPLICATIONS,
  BEST_PRACTICES,
  LENDING_KPIS
};