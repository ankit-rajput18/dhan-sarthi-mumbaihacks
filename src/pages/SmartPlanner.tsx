import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI, goalsAPI, budgetAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  PiggyBank,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Gamepad2,
  Bike,
  Home,
  Plane,
  GraduationCap,
  Heart,
  Smartphone,
  Watch,
  Camera,
  Laptop,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  CreditCard,
  X,
  MoreHorizontal
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from "@/components/ui/alert";
import TransactionManager from "@/components/TransactionManager";
import { Toaster, toast } from "@/components/ui/sonner";

interface GoalData {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  category: string;
  description: string;
  priority: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  description: string;
  priority: string;
  icon: any;
  color: string;
}

interface BudgetCategory {
  name: string;
  amount: number; // budget amount
  spent: number; // actual spending
  icon: any;
  color: string;
}

const SmartPlanner = () => {
  const navigate = useNavigate();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalData, setGoalData] = useState<GoalData>({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    category: "",
    description: "",
    priority: "medium"
  });
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Available funds state
  const [availableFunds, setAvailableFunds] = useState<any>(null);
  const [loadingFunds, setLoadingFunds] = useState(true);

  // Allocation modal state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [allocationData, setAllocationData] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    note: ""
  });

  // Goal categories with icons
  const goalCategories = [
    { value: "vehicle", label: "Vehicle", icon: Bike, color: "bg-blue-500" },
    { value: "home", label: "Home", icon: Home, color: "bg-green-500" },
    { value: "travel", label: "Travel", icon: Plane, color: "bg-purple-500" },
    { value: "education", label: "Education", icon: GraduationCap, color: "bg-orange-500" },
    { value: "health", label: "Health", icon: Heart, color: "bg-red-500" },
    { value: "technology", label: "Technology", icon: Smartphone, color: "bg-indigo-500" },
    { value: "luxury", label: "Luxury", icon: Watch, color: "bg-pink-500" },
    { value: "hobby", label: "Hobby", icon: Camera, color: "bg-yellow-500" },
    { value: "business", label: "Business", icon: Laptop, color: "bg-gray-500" },
    { value: "emergency", label: "Emergency Fund", icon: PiggyBank, color: "bg-emerald-500" },
  ];

  // Category mapping for icons and colors
  const categoryConfig: { [key: string]: { icon: any; color: string } } = {
    food: { icon: Utensils, color: "bg-red-500" },
    transport: { icon: Car, color: "bg-orange-500" },
    shopping: { icon: ShoppingBag, color: "bg-yellow-500" },
    bills: { icon: Zap, color: "bg-green-500" },
    entertainment: { icon: Gamepad2, color: "bg-blue-500" },
    healthcare: { icon: Heart, color: "bg-pink-500" },
    education: { icon: GraduationCap, color: "bg-purple-500" },
    travel: { icon: Plane, color: "bg-indigo-500" },
    "other-expense": { icon: MoreHorizontal, color: "bg-gray-500" },
  };

  // Replace the mock data with state for real data
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<BudgetCategory[]>([]);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [spendingTrend, setSpendingTrend] = useState<Array<{ month: string; amount: number }>>([]);
  const [loadingTrend, setLoadingTrend] = useState(true);

  // Fetch goals from API when component mounts
  useEffect(() => {
    fetchGoals();
    fetchMonthlyBreakdown();
    fetchAvailableFunds();
    fetchSpendingTrend();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response: any = await goalsAPI.getAll();
      // Transform API response to match component's expected format
      const transformedGoals = response.goals.map((goal: any) => {
        const category = goalCategories.find(cat => cat.value === goal.category);
        return {
          id: goal._id,
          name: goal.name,
          target: goal.targetAmount,
          current: goal.currentAmount,
          deadline: new Date(goal.deadline).toLocaleDateString(),
          category: goal.category,
          description: goal.description,
          priority: goal.priority,
          icon: category?.icon || Target,
          color: category?.color || "bg-gray-500"
        };
      });
      setSavingsGoals(transformedGoals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate that category and priority are valid before sending to API
      const validCategories = ['vehicle', 'home', 'travel', 'education', 'health', 'technology', 'luxury', 'hobby', 'business', 'emergency'] as const;
      const validPriorities = ['low', 'medium', 'high'] as const;
      
      if (!validCategories.includes(goalData.category as any)) {
        toast.error("Please select a valid category");
        return;
      }
      
      if (!validPriorities.includes(goalData.priority as any)) {
        toast.error("Please select a valid priority");
        return;
      }

      const newGoalData = {
        name: goalData.name,
        targetAmount: parseInt(goalData.targetAmount),
        currentAmount: parseInt(goalData.currentAmount),
        deadline: goalData.deadline,
        category: goalData.category as 'vehicle' | 'home' | 'travel' | 'education' | 'health' | 'technology' | 'luxury' | 'hobby' | 'business' | 'emergency',
        description: goalData.description,
        priority: goalData.priority as 'low' | 'medium' | 'high'
      };

      await goalsAPI.create(newGoalData);
      toast.success("Goal created successfully");
      setShowAddGoal(false);
      resetGoalForm();
      fetchGoals(); // Refresh the goals list
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    }
  };

  const resetGoalForm = () => {
    setGoalData({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      deadline: "",
      category: "",
      description: "",
      priority: "medium"
    });
  };

  // Fetch available funds (all time)
  const fetchAvailableFunds = async () => {
    try {
      setLoadingFunds(true);
      const response: any = await goalsAPI.getAvailableFunds();
      setAvailableFunds(response);
    } catch (error) {
      console.error("Error fetching available funds:", error);
      // Set default values instead of showing error
      setAvailableFunds({
        totalIncome: 0,
        totalExpenses: 0,
        totalEMIs: 0,
        totalAllocated: 0,
        availableFunds: 0,
        breakdown: {
          income: 0,
          expenses: 0,
          emis: 0,
          allocated: 0,
          available: 0
        }
      });
    } finally {
      setLoadingFunds(false);
    }
  };

  // Fetch spending trend for last 6 months
  const fetchSpendingTrend = async () => {
    try {
      setLoadingTrend(true);
      const now = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trendData = [];

      // Get last 6 months of data
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
        
        try {
          const response = await transactionAPI.getSummary(startDate, endDate);
          const expenses = response?.categoryBreakdown
            ?.filter((item: any) => 
              item._id !== 'other-income' && 
              item._id !== 'salary' && 
              item._id !== 'freelance' && 
              item._id !== 'investment' && 
              item._id !== 'business'
            )
            .reduce((sum: number, item: any) => sum + Math.abs(item.total), 0) || 0;
          
          trendData.push({
            month: monthNames[month],
            amount: expenses
          });
        } catch (error) {
          console.error(`Error fetching data for ${monthNames[month]}:`, error);
          trendData.push({
            month: monthNames[month],
            amount: 0
          });
        }
      }

      setSpendingTrend(trendData);
    } catch (error) {
      console.error("Error fetching spending trend:", error);
    } finally {
      setLoadingTrend(false);
    }
  };

  // Handle allocation modal open
  const handleOpenAllocateModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setAllocationData({
      amount: "",
      date: new Date().toISOString().split('T')[0],
      note: ""
    });
    setShowAllocateModal(true);
  };

  // Handle allocation submit
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      const amount = parseFloat(allocationData.amount);
      
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }

      if (availableFunds && amount > availableFunds.availableFunds) {
        toast.error("Amount exceeds available funds");
        return;
      }

      await goalsAPI.addContribution(selectedGoal.id, {
        amount,
        date: allocationData.date,
        note: allocationData.note
      });

      toast.success(`₹${amount.toLocaleString()} allocated to ${selectedGoal.name}`);
      setShowAllocateModal(false);
      setSelectedGoal(null);
      
      // Refresh data
      fetchGoals();
      fetchAvailableFunds();
    } catch (error) {
      console.error("Error allocating funds:", error);
      toast.error("Failed to allocate funds");
    }
  };

  // Fetch monthly budget breakdown
  const fetchMonthlyBreakdown = async () => {
    try {
      setLoadingBudget(true);
      
      // Get current month and year
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed

      // Fetch budget data
      let budgetResponse: any;
      try {
        budgetResponse = await budgetAPI.getByMonth(year, month);
      } catch (error) {
        // If no budget exists, we'll show 0 budgets
        budgetResponse = { budget: null };
      }

      // Fetch transaction data for current month
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      
      const transactionResponse = await transactionAPI.getSummary(startDate, endDate);
      const categoryBreakdown = transactionResponse?.categoryBreakdown || [];

      // Combine budget and spending data
      const budgetCategories = budgetResponse.budget?.categories || [];
      
      // Create a map of spending by category
      const spendingMap: { [key: string]: number } = {};
      categoryBreakdown
        .filter((item: any) => item._id !== 'other-income' && item._id !== 'salary' && item._id !== 'freelance' && item._id !== 'investment' && item._id !== 'business')
        .forEach((item: any) => {
          spendingMap[item._id] = Math.abs(item.total); // Use absolute value for expenses
        });

      // Create the breakdown data
      const breakdownData: BudgetCategory[] = [];
      
      // Add all budget categories with their spending
      budgetCategories.forEach((budgetCat: any) => {
        const categoryKey = budgetCat.name.toLowerCase();
        const config = categoryConfig[categoryKey] || { icon: MoreHorizontal, color: "bg-gray-500" };
        
        breakdownData.push({
          name: budgetCat.name.charAt(0).toUpperCase() + budgetCat.name.slice(1),
          amount: budgetCat.amount,
          spent: spendingMap[categoryKey] || 0,
          icon: config.icon,
          color: config.color
        });
      });

      // Add any spending categories that don't have a budget
      Object.keys(spendingMap).forEach(categoryKey => {
        const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        const hasBudget = budgetCategories.some((cat: any) => cat.name.toLowerCase() === categoryKey);
        
        if (!hasBudget && spendingMap[categoryKey] > 0) {
          const config = categoryConfig[categoryKey] || { icon: MoreHorizontal, color: "bg-gray-500" };
          
          breakdownData.push({
            name: categoryName,
            amount: 0, // No budget set
            spent: spendingMap[categoryKey],
            icon: config.icon,
            color: config.color
          });
        }
      });

      setMonthlyBreakdown(breakdownData);
    } catch (error) {
      console.error("Error fetching monthly breakdown:", error);
      // Fallback to mock data if API fails
      setMonthlyBreakdown([
        { category: "Food", amount: 10000, spent: 8500, icon: Utensils, color: "bg-red-500" },
        { category: "Transport", amount: 4000, spent: 3200, icon: Car, color: "bg-orange-500" },
        { category: "Shopping", amount: 5000, spent: 4500, icon: ShoppingBag, color: "bg-yellow-500" },
        { category: "Bills", amount: 7000, spent: 6800, icon: Zap, color: "bg-green-500" },
        { category: "Entertainment", amount: 3000, spent: 2800, icon: Gamepad2, color: "bg-blue-500" },
      ].map(item => ({
        name: item.category,
        amount: item.amount,
        spent: item.spent,
        icon: item.icon,
        color: item.color
      })));
    } finally {
      setLoadingBudget(false);
    }
  };

  // Update the monthly breakdown when a budget is set
  const updateBudgetCategory = async (categoryName: string, amount: number) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      await budgetAPI.updateCategory(year, month, categoryName, amount);
      // Refresh the breakdown after updating
      await fetchMonthlyBreakdown();
      toast.success("Budget updated successfully");
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget");
    }
  };

  // AI Analysis Functions
  const getAIFinancialInsights = () => {
    const totalEMI = existingLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    const monthlyIncome = 85000; // Mock monthly income
    const emiToIncomeRatio = (totalEMI / monthlyIncome) * 100;
    const totalGoalsValue = savingsGoals.reduce((sum, goal) => sum + goal.target, 0);
    const totalCurrentSavings = savingsGoals.reduce((sum, goal) => sum + goal.current, 0);
    const totalRemainingForGoals = totalGoalsValue - totalCurrentSavings;
    
    const insights = [];

    // EMI to Income Ratio Analysis
    if (emiToIncomeRatio > 60) {
      insights.push({
        id: 1,
        type: "warning",
        icon: AlertTriangle,
        title: "High Debt Burden",
        message: `Your EMI to income ratio is ${emiToIncomeRatio.toFixed(1)}%, which is very high. Consider focusing on debt reduction before taking new loans.`,
        recommendation: "Prioritize paying off high-interest loans first, especially your personal loan at 12.5%."
      });
    } else if (emiToIncomeRatio > 40) {
      insights.push({
        id: 2,
        type: "info",
        icon: AlertTriangle,
        title: "Moderate Debt Level",
        message: `Your EMI to income ratio is ${emiToIncomeRatio.toFixed(1)}%. You have some room for additional loans but should be cautious.`,
        recommendation: "Consider saving for smaller goals and only take loans for essential purchases."
      });
    } else {
      insights.push({
        id: 3,
        type: "success",
        icon: CheckCircle,
        title: "Healthy Debt Level",
        message: `Your EMI to income ratio is ${emiToIncomeRatio.toFixed(1)}%, which is manageable.`,
        recommendation: "You have good capacity for additional loans if needed for important goals."
      });
    }

    // Goal vs Loan Analysis
    const highInterestLoans = existingLoans.filter(loan => loan.interestRate > 10);
    const lowInterestLoans = existingLoans.filter(loan => loan.interestRate <= 8);

    if (highInterestLoans.length > 0) {
      insights.push({
        id: 4,
        type: "warning",
        icon: CreditCard,
        title: "High-Interest Debt Detected",
        message: `You have ${highInterestLoans.length} loan(s) with interest rates above 10%.`,
        recommendation: "Focus on paying off high-interest loans before taking new ones. Consider debt consolidation for better rates."
      });
    }

    // Savings vs Loan Recommendation
    if (totalRemainingForGoals > 500000) {
      insights.push({
        id: 5,
        type: "info",
        icon: PiggyBank,
        title: "Large Financial Goals",
        message: `You need ₹${(totalRemainingForGoals / 100000).toFixed(1)}L more to achieve all your goals.`,
        recommendation: "For goals above ₹5L, consider a mix of savings and loans. Save for smaller goals, loan for larger ones."
      });
    }

    // Specific Goal Recommendations
    savingsGoals.forEach((goal, index) => {
      const monthsToDeadline = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const remaining = goal.target - goal.current;
      const monthlySavingsNeeded = monthsToDeadline > 0 ? remaining / monthsToDeadline : 0;
      
      if (goal.target > 300000 && monthsToDeadline < 12) {
        insights.push({
          id: 100 + index,
          type: "warning",
          icon: Target,
          title: `Urgent Goal: ${goal.name}`,
          message: `You need ₹${monthlySavingsNeeded.toLocaleString()} monthly to reach your ${goal.name} goal.`,
          recommendation: `Consider a loan for ${goal.name} if it's essential, or extend the deadline to make it more achievable.`
        });
      }
    });

    return insights;
  };

  const getGoalSpecificRecommendation = (goal: any) => {
    const totalEMI = existingLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    const monthlyIncome = 85000;
    const availableIncome = monthlyIncome - totalEMI;
    const monthsToDeadline = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const remaining = goal.target - goal.current;
    const monthlySavingsNeeded = monthsToDeadline > 0 ? remaining / monthsToDeadline : 0;
    const progressPercentage = (goal.current / goal.target) * 100;

    // Category-specific intelligent recommendations
    const getCategorySpecificAdvice = () => {
      switch (goal.category) {
        case 'vehicle':
          if (goal.target <= 150000) {
            return {
              message: "Consider a used vehicle or down payment strategy",
              reason: "Used vehicles often offer better value. Save 40-50% as down payment to reduce EMI burden."
            };
          } else if (goal.target <= 500000) {
            return {
              message: "Hybrid approach: Save 60% + affordable EMI",
              reason: "Large vehicle purchases benefit from substantial down payment to keep EMIs manageable."
            };
          } else {
            return {
              message: "Premium vehicle financing with strategic down payment",
              reason: "Consider 70% down payment + shorter loan term to minimize interest costs."
            };
          }
        
        case 'home':
          if (goal.target <= 500000) {
            return {
              message: "Perfect for down payment or renovation savings",
              reason: "This amount is ideal for home down payment, renovation, or furniture purchases."
            };
          } else if (goal.target <= 2000000) {
            return {
              message: "Strategic home investment with partial financing",
              reason: "Save 60-70% for down payment, finance remaining with home loan benefits."
            };
          } else {
            return {
              message: "Long-term home goal with investment strategy",
              reason: "Consider SIP in mutual funds for 5+ years, then use as down payment."
            };
          }
        
        case 'travel':
          if (goal.target <= 100000) {
            return {
              message: "Travel fund with smart saving strategies",
              reason: "Use travel credit cards for rewards, save in high-yield accounts, consider travel insurance."
            };
          } else {
            return {
              message: "Luxury travel with investment-backed approach",
              reason: "Invest in liquid funds for 1-2 years, use travel rewards cards, plan during off-season."
            };
          }
        
        case 'education':
          if (goal.target <= 200000) {
            return {
              message: "Education fund with scholarship opportunities",
              reason: "Research scholarships, apply for education loans with tax benefits, consider part-time work."
            };
          } else {
            return {
              message: "Higher education with strategic financing",
              reason: "Education loans offer tax benefits, longer repayment terms, and often lower interest rates."
            };
          }
        
        case 'emergency':
          return {
            message: "Emergency fund - prioritize this goal",
            reason: "Aim for 6 months of expenses. Keep in high-yield savings or liquid funds for quick access."
          };
        
        case 'technology':
          if (goal.target <= 50000) {
            return {
              message: "Tech upgrade with cash purchase",
              reason: "Avoid financing small tech purchases. Use cashback cards and wait for sales/discounts."
            };
          } else {
            return {
              message: "Premium tech with 0% EMI options",
              reason: "Many retailers offer 0% EMI on premium tech. Save 50% + use interest-free financing."
            };
          }
        
        case 'business':
          if (goal.target <= 300000) {
            return {
              message: "Business startup with bootstrapping approach",
              reason: "Start small, reinvest profits, consider micro-loans or business credit cards."
            };
          } else {
            return {
              message: "Business expansion with strategic financing",
              reason: "Mix of savings + business loans. Business loans often have better terms than personal loans."
            };
          }
        
        default:
          return {
            message: "Smart goal planning with mixed approach",
            reason: "Consider your timeline, interest rates, and opportunity costs for optimal strategy."
          };
      }
    };

    // Financial situation analysis
    const getFinancialAdvice = () => {
      const debtToIncomeRatio = (totalEMI / monthlyIncome) * 100;
      const savingsRate = (monthlySavingsNeeded / availableIncome) * 100;
      
      if (debtToIncomeRatio > 50) {
        return {
          message: "Focus on debt reduction first",
          reason: "Your debt ratio is high. Prioritize paying off existing loans before taking new ones."
        };
      }
      
      if (savingsRate > 40) {
        return {
          message: "Aggressive saving may strain your budget",
          reason: "Consider extending timeline or reducing goal amount to maintain financial comfort."
        };
      }
      
      if (progressPercentage > 70) {
        return {
          message: "Great progress! Stay consistent",
          reason: "You're close to your goal. Consider increasing monthly savings to reach it faster."
        };
      }
      
      if (monthsToDeadline < 6 && progressPercentage < 30) {
        return {
          message: "Timeline adjustment needed",
          reason: "Current timeline may be too aggressive. Consider extending deadline or reducing target amount."
        };
      }
      
      return null;
    };

    // Get category-specific advice
    const categoryAdvice = getCategorySpecificAdvice();
    
    // Check if financial situation requires attention
    const financialAdvice = getFinancialAdvice();
    
    if (financialAdvice) {
      return {
        type: "alert",
        message: financialAdvice.message,
        reason: financialAdvice.reason
      };
    }

    // Return category-specific recommendation
    if (goal.target <= 200000) {
      return {
        type: "save",
        message: categoryAdvice.message,
        reason: categoryAdvice.reason
      };
    } else if (goal.target > 1000000 || (goal.target > 500000 && monthsToDeadline < 18)) {
      return {
        type: "loan",
        message: categoryAdvice.message,
        reason: categoryAdvice.reason
      };
    } else {
      return {
        type: "hybrid",
        message: categoryAdvice.message,
        reason: categoryAdvice.reason
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Planner</h1>
          <p className="text-muted-foreground">Set and track your financial goals</p>
        </div>
        <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
          <DialogTrigger asChild>
            <Button 
              variant="hero" 
              className="gap-2"
              onClick={() => resetGoalForm()}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Goal</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Financial Goal</DialogTitle>
              <DialogDescription>Set a new savings target and track your progress</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  placeholder="e.g., Buy a Bike, Emergency Fund, Vacation"
                  value={goalData.name}
                  onChange={(e) => setGoalData({ ...goalData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    placeholder="200000"
                    value={goalData.targetAmount}
                    onChange={(e) => setGoalData({ ...goalData, targetAmount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAmount">Current Savings (₹)</Label>
                  <Input
                    id="currentAmount"
                    type="number"
                    placeholder="0"
                    value={goalData.currentAmount}
                    onChange={(e) => setGoalData({ ...goalData, currentAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Goal Category</Label>
                  <Select value={goalData.category} onValueChange={(value) => setGoalData({ ...goalData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <category.icon className="w-4 h-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={goalData.priority} onValueChange={(value) => setGoalData({ ...goalData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Target Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={goalData.deadline}
                  onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal in detail..."
                  value={goalData.description}
                  onChange={(e) => setGoalData({ ...goalData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Goal
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Funds & Spending Trend Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Available Funds Card - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="shadow-card border-0 bg-gradient-to-br from-primary/10 to-primary/5 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                Available for Goals
              </CardTitle>
              <CardDescription>Total funds available to allocate to your savings goals</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFunds ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : availableFunds ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">
                      ₹{availableFunds.availableFunds.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Available to allocate</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="font-semibold text-green-600">+₹{availableFunds.totalIncome.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <p className="font-semibold text-red-600">-₹{availableFunds.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EMIs</p>
                      <p className="font-semibold text-orange-600">-₹{availableFunds.totalEMIs.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Allocated</p>
                      <p className="font-semibold text-blue-600">-₹{availableFunds.totalAllocated.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Unable to load available funds</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Spending Trend Chart - Takes 3 columns */}
        <div className="lg:col-span-3">
          <Card className="shadow-card border-0 h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-primary" />
                Spending Trend
              </CardTitle>
              <CardDescription>Your monthly spending pattern over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrend ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : spendingTrend.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
                  <TrendingDown className="w-12 h-12 mb-2 text-muted-foreground/20" />
                  <p>No spending data available</p>
                  <p className="text-sm mt-1">Add transactions to see your spending trend</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendingTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Spending']} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Budget Breakdown & Savings Goals Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown - Takes 1 column */}
        <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Monthly Budget Breakdown
              </CardTitle>
              <CardDescription>Track your spending against budgets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingBudget ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : monthlyBreakdown.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground/20 mb-2" />
                  <p>No budget data found</p>
                  <p className="text-sm mt-1">Set your monthly budget to start tracking</p>
                </div>
              ) : (
                monthlyBreakdown.map((item, index) => {
                  const percentage = item.amount > 0 ? (item.spent / item.amount) * 100 : (item.spent > 0 ? 100 : 0);
                  const isOverBudget = percentage > 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                            <item.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ₹{item.spent.toLocaleString()} / ₹{item.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={isOverBudget ? "destructive" : "secondary"}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

        {/* Savings Goals - Takes 1 column */}
        <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                Savings Goals
              </CardTitle>
              <CardDescription>Track your progress towards financial goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {savingsGoals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                const remaining = goal.target - goal.current;
                const monthsToDeadline = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
                const monthlySavingsNeeded = monthsToDeadline > 0 ? remaining / monthsToDeadline : 0;
                
                return (
                  <div key={goal.id} className="space-y-3 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${goal.color} flex items-center justify-center`}>
                          <goal.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}
                          className="mb-1"
                        >
                          {goal.priority}
                        </Badge>
                        <p className="text-sm font-bold text-primary">{percentage.toFixed(0)}%</p>
                      </div>
                    </div>
                    
                    <Progress value={percentage} className="h-3" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Saved</p>
                        <p className="font-semibold">₹{goal.current.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-semibold">₹{goal.target.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {goal.description && (
                      <p className="text-xs text-muted-foreground italic">
                        {goal.description}
                      </p>
                    )}
                    
                    {monthsToDeadline > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-700">
                          <strong>Monthly savings needed:</strong> ₹{monthlySavingsNeeded.toLocaleString()} 
                          ({monthsToDeadline} months remaining)
                        </p>
                      </div>
                    )}

                    {/* Allocate Button */}
                    <Button 
                      className="w-full gap-2" 
                      variant="outline"
                      onClick={() => handleOpenAllocateModal(goal)}
                    >
                      <IndianRupee className="w-4 h-4" />
                      Allocate Funds
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
      </div>

      {/* Allocation Modal */}
      <Dialog open={showAllocateModal} onOpenChange={setShowAllocateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Allocate to: {selectedGoal?.name}</DialogTitle>
            <DialogDescription>
              Add funds to your goal from available balance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAllocateSubmit} className="space-y-4">
            {availableFunds && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium">Available Funds</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{availableFunds.availableFunds.toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="allocateAmount">Amount (₹)</Label>
              <Input
                id="allocateAmount"
                type="number"
                placeholder="5000"
                value={allocationData.amount}
                onChange={(e) => setAllocationData({ ...allocationData, amount: e.target.value })}
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocateDate">Date</Label>
              <Input
                id="allocateDate"
                type="date"
                value={allocationData.date}
                onChange={(e) => setAllocationData({ ...allocationData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocateNote">Note (Optional)</Label>
              <Textarea
                id="allocateNote"
                placeholder="e.g., Saved from January salary"
                value={allocationData.note}
                onChange={(e) => setAllocationData({ ...allocationData, note: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Allocate
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAllocateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};

export default SmartPlanner;