import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  TrendingUp, 
  FileText, 
  Calculator,
  PiggyBank,
  Briefcase,
  Heart,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

const TaxTips = () => {
  // Mock data for tax planning
  const currentFinancialYear = "2023-24";
  const section80CLimit = 150000;
  const section80CUsed = 85000;
  const section80CRemaining = section80CLimit - section80CUsed;

  const taxSavingOptions = [
    {
      id: 1,
      name: "ELSS Mutual Funds",
      category: "80C",
      description: "Equity Linked Savings Scheme with tax benefits and market returns",
      minInvestment: 500,
      lockInPeriod: "3 years",
      expectedReturns: "12-15%",
      riskLevel: "High",
      icon: TrendingUp,
      color: "bg-green-500",
      recommended: true
    },
    {
      id: 2,
      name: "PPF (Public Provident Fund)",
      category: "80C",
      description: "Government backed tax-free returns with 15-year lock-in",
      minInvestment: 500,
      lockInPeriod: "15 years",
      expectedReturns: "7.1%",
      riskLevel: "Low",
      icon: Shield,
      color: "bg-blue-500",
      recommended: true
    },
    {
      id: 3,
      name: "National Pension System",
      category: "80CCD",
      description: "Additional ₹50,000 deduction for retirement planning",
      minInvestment: 1000,
      lockInPeriod: "Till retirement",
      expectedReturns: "10-12%",
      riskLevel: "Medium",
      icon: Briefcase,
      color: "bg-purple-500",
      recommended: false
    },
    {
      id: 4,
      name: "Health Insurance",
      category: "80D",
      description: "Tax deduction up to ₹25,000 for health insurance premiums",
      minInvestment: 5000,
      lockInPeriod: "1 year",
      expectedReturns: "Health coverage",
      riskLevel: "Low",
      icon: Heart,
      color: "bg-red-500",
      recommended: true
    },
    {
      id: 5,
      name: "Education Loan Interest",
      category: "80E",
      description: "Full interest deduction on education loans",
      minInvestment: 0,
      lockInPeriod: "Loan duration",
      expectedReturns: "Tax savings",
      riskLevel: "Low",
      icon: GraduationCap,
      color: "bg-yellow-500",
      recommended: false
    },
    {
      id: 6,
      name: "Tax Saver FD",
      category: "80C",
      description: "Fixed deposits with 5-year lock-in and guaranteed returns",
      minInvestment: 100,
      lockInPeriod: "5 years",
      expectedReturns: "5.5-6.5%",
      riskLevel: "Low",
      icon: PiggyBank,
      color: "bg-orange-500",
      recommended: false
    }
  ];

  const taxCalculation = {
    grossIncome: 850000,
    standardDeduction: 50000,
    section80C: section80CUsed,
    section80D: 15000,
    taxableIncome: 0,
    taxLiability: 0,
    potentialSavings: 0
  };

  // Calculate taxable income and tax
  taxCalculation.taxableIncome = taxCalculation.grossIncome - taxCalculation.standardDeduction - taxCalculation.section80C - taxCalculation.section80D;
  
  // Simplified tax calculation for new regime
  if (taxCalculation.taxableIncome <= 300000) {
    taxCalculation.taxLiability = 0;
  } else if (taxCalculation.taxableIncome <= 600000) {
    taxCalculation.taxLiability = (taxCalculation.taxableIncome - 300000) * 0.05;
  } else if (taxCalculation.taxableIncome <= 900000) {
    taxCalculation.taxLiability = 15000 + (taxCalculation.taxableIncome - 600000) * 0.10;
  } else if (taxCalculation.taxableIncome <= 1200000) {
    taxCalculation.taxLiability = 45000 + (taxCalculation.taxableIncome - 900000) * 0.15;
  } else {
    taxCalculation.taxLiability = 90000 + (taxCalculation.taxableIncome - 1200000) * 0.20;
  }

  // Calculate potential savings if remaining 80C is utilized
  const potentialTaxableIncome = taxCalculation.taxableIncome - section80CRemaining;
  let potentialTaxLiability = 0;
  if (potentialTaxableIncome <= 300000) {
    potentialTaxLiability = 0;
  } else if (potentialTaxableIncome <= 600000) {
    potentialTaxLiability = (potentialTaxableIncome - 300000) * 0.05;
  } else if (potentialTaxableIncome <= 900000) {
    potentialTaxLiability = 15000 + (potentialTaxableIncome - 600000) * 0.10;
  } else if (potentialTaxableIncome <= 1200000) {
    potentialTaxLiability = 45000 + (potentialTaxableIncome - 900000) * 0.15;
  } else {
    potentialTaxLiability = 90000 + (potentialTaxableIncome - 1200000) * 0.20;
  }

  taxCalculation.potentialSavings = taxCalculation.taxLiability - potentialTaxLiability;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax-Saving Tips</h1>
          <p className="text-muted-foreground">Maximize your tax savings with smart investment choices</p>
        </div>
        <Badge variant="outline" className="text-sm">
          FY {currentFinancialYear}
        </Badge>
      </div>

      {/* Disclaimer */}
      <Alert className="border-warning/20 bg-warning/5">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription>
          <strong>Disclaimer:</strong> These tips are for guidance only and not financial advice. 
          Consult a tax professional for personalized recommendations.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Tax Overview & Unused Limits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tax Overview */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Your Tax Overview
              </CardTitle>
              <CardDescription>Current year tax calculation and potential savings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gross Income</span>
                    <span className="font-medium">₹{taxCalculation.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Standard Deduction</span>
                    <span className="font-medium text-success">-₹{taxCalculation.standardDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Section 80C Used</span>
                    <span className="font-medium text-success">-₹{taxCalculation.section80C.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Section 80D Used</span>
                    <span className="font-medium text-success">-₹{taxCalculation.section80D.toLocaleString()}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between font-medium">
                    <span>Taxable Income</span>
                    <span>₹{taxCalculation.taxableIncome.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Tax Liability</span>
                    <span className="font-medium text-danger">₹{Math.round(taxCalculation.taxLiability).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Potential Savings</span>
                    <span className="font-medium text-success">₹{Math.round(taxCalculation.potentialSavings).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">Action Required</p>
                    <p className="text-xs text-muted-foreground">
                      Invest ₹{section80CRemaining.toLocaleString()} more in 80C to save ₹{Math.round(taxCalculation.potentialSavings).toLocaleString()} in taxes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Tax Saving Options */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Recommended Tax-Saving Investments</h3>
            <div className="grid gap-4">
              {taxSavingOptions.filter(option => option.recommended).map((option) => (
                <Card key={option.id} className="shadow-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center`}>
                          <option.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{option.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {option.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        </div>
                      </div>
                      {option.recommended && (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          Recommended
                        </Badge>
                      )}
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Min Investment</p>
                        <p className="font-medium">₹{option.minInvestment}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lock-in Period</p>
                        <p className="font-medium">{option.lockInPeriod}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Returns</p>
                        <p className="font-medium">{option.expectedReturns}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Risk Level</p>
                        <Badge variant={
                          option.riskLevel === "Low" ? "secondary" :
                          option.riskLevel === "Medium" ? "outline" : "destructive"
                        } className="text-xs">
                          {option.riskLevel}
                        </Badge>
                      </div>
                    </div>

                    {/* <div className="flex gap-2 mt-4">
                      <Button variant="hero" size="sm">
                        Invest Now
                      </Button>
                      <Button variant="outline" size="sm">
                        Learn More
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                     */}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Tips & Other Options */}
        <div className="space-y-6">
          {/* Quick Tax Tips */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm font-medium text-success mb-1">Deadline Reminder</p>
                <p className="text-xs text-muted-foreground">
                  Section 80C investments must be completed by March 31st
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">ELSS vs PPF</p>
                <p className="text-xs text-muted-foreground">
                  ELSS offers higher returns but comes with market risk
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Other Tax Saving Options */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle>Other Options</CardTitle>
              <CardDescription>Additional tax-saving instruments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {taxSavingOptions.filter(option => !option.recommended).map((option) => (
                <div key={option.id} className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${option.color} flex items-center justify-center`}>
                      <option.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.expectedReturns}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {option.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default TaxTips;
