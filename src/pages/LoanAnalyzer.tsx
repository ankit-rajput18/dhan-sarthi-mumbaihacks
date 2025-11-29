import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calculator,
  Plus,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PieChart,
  CreditCard,
  Home,
  Car,
  FileText,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { loanAPI, transactionAPI } from "@/lib/api";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";
import LendingRecommendations from "@/components/LendingRecommendations";

const LoanAnalyzer = () => {
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [showPaymentLogs, setShowPaymentLogs] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showInstallmentSchedule, setShowInstallmentSchedule] = useState(false);
  const [installmentData, setInstallmentData] = useState<any>(null);
  const [loanData, setLoanData] = useState({
    type: "",
    name: "",
    principal: "",
    interestRate: "",
    tenure: "",
    startDate: new Date().toISOString().split("T")[0],
    installmentDueDay: new Date().getDate(),
    lender: "",
  });

  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        const res = await loanAPI.getAll({ page: 1, limit: 50 });
        const mapped = (res.loans || []).map((l: any) => ({
          id: l._id,
          name: l.loanName,
          type: l.loanType,
          principal: l.principalAmount,
          remainingBalance: l.remainingBalance,
          emiAmount: l.emiAmount,
          interestRate: l.interestRate,
          tenure: l.tenureMonths,
          totalInterest: l.totalInterest,
          remainingTenure: Math.max(0, Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))),
          startDate: l.startDate,
          nextDueDate: l.nextEmiDate,
          installmentDueDay: l.installmentDueDay,
          lender: l.lender,
          icon: l.loanType === 'home' ? Home : l.loanType === 'car' ? Car : CreditCard,
          color: l.loanType === 'home' ? 'bg-blue-500' : l.loanType === 'car' ? 'bg-purple-500' : 'bg-orange-500',
          penaltyRate: 0,
          terms: [],
          paymentHistory: (l.payments || []).map((p: any, idx: number) => ({
            id: idx + 1,
            date: p.paymentDate,
            amount: p.amount,
            status: 'paid',
            notes: p.notes || '',
            emiNumber: p.emiNumber,
            paymentMethod: p.paymentMethod
          }))
        }));
        setLoans(mapped);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load loans');
      }
    };
    loadLoans();
  }, []);

  const totalEMI = useMemo(() => loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0), [loans]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const emiToIncomeRatio = (totalEMI / (monthlyIncome || 1)) * 100;

  useEffect(() => {
    const loadIncome = async () => {
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        const tx = await transactionAPI.getSummary(start, end);
        setMonthlyIncome(tx?.summary?.totalIncome || 0);
      } catch {
        // keep default 0 on failure
      }
    };
    loadIncome();
  }, []);

  const loanTypes = [
    { value: "home", label: "Home Loan" },
    { value: "car", label: "Vehicle Loan" },
    { value: "personal", label: "Personal Loan" },
    { value: "education", label: "Education Loan" },
    { value: "business", label: "Business Loan" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        loanType: loanData.type as any,
        loanName: (loanData.name && loanData.name.trim()) ? loanData.name.trim() : (loanData.type ? `${loanData.type[0].toUpperCase()+loanData.type.slice(1)} Loan` : 'Loan'),
        principalAmount: parseFloat(loanData.principal),
        interestRate: parseFloat(loanData.interestRate),
        tenureMonths: parseInt(loanData.tenure, 10),
        lender: loanData.lender || 'Unknown',
        startDate: new Date(loanData.startDate).toISOString(),
        installmentDueDay: parseInt(loanData.installmentDueDay.toString(), 10),
      };
      if (!payload.loanType || isNaN(payload.principalAmount) || isNaN(payload.interestRate) || isNaN(payload.tenureMonths)) {
        toast.error('Please fill all required fields');
        return;
      }
      if (editingLoanId) {
        await loanAPI.update(editingLoanId, {
          loanType: payload.loanType as any,
          loanName: payload.loanName,
          principalAmount: payload.principalAmount,
          interestRate: payload.interestRate,
          tenureMonths: payload.tenureMonths,
          startDate: payload.startDate,
          lender: payload.lender,
          installmentDueDay: payload.installmentDueDay,
        } as any);
        toast.success('Loan updated');
      } else {
        await loanAPI.create(payload as any);
        toast.success('Loan created');
      }
      setShowAddLoan(false);
      setLoanData({
        type: "",
        name: "",
        principal: "",
        interestRate: "",
        tenure: "",
        startDate: new Date().toISOString().split("T")[0],
        installmentDueDay: new Date().getDate(),
        lender: "",
      });
      setEditingLoanId(null);
      // reload
      const res = await loanAPI.getAll({ page: 1, limit: 50 });
      const mapped = (res.loans || []).map((l: any) => ({
        id: l._id,
        name: l.loanName,
        type: l.loanType,
        principal: l.principalAmount,
        remainingBalance: l.remainingBalance,
        emiAmount: l.emiAmount,
        interestRate: l.interestRate,
        tenure: l.tenureMonths,
        totalInterest: l.totalInterest,
        remainingTenure: Math.max(0, Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))),
        startDate: l.startDate,
        nextDueDate: l.nextEmiDate,
        installmentDueDay: l.installmentDueDay,
        lender: l.lender,
        icon: l.loanType === 'home' ? Home : l.loanType === 'car' ? Car : CreditCard,
        color: l.loanType === 'home' ? 'bg-blue-500' : l.loanType === 'car' ? 'bg-purple-500' : 'bg-orange-500',
        penaltyRate: 0,
        terms: [],
        paymentHistory: (l.payments || []).map((p: any, idx: number) => ({ id: idx + 1, date: p.paymentDate, amount: p.amount, status: 'paid', notes: p.notes || '', emiNumber: p.emiNumber }))
      }));
      setLoans(mapped);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create loan');
    }
  };

  const openEditLoan = (loan: any) => {
    setEditingLoanId(loan.id);
    setLoanData({
      type: loan.type,
      name: loan.name || '',
      principal: String(loan.principal),
      interestRate: String(loan.interestRate),
      tenure: String(loan.tenure),
      startDate: new Date(loan.startDate).toISOString().split('T')[0],
      installmentDueDay: loan.installmentDueDay || new Date(loan.startDate).getDate(),
      lender: loan.lender || '',
    });
    setShowAddLoan(true);
  };

  const deleteLoan = async (id: string) => {
    if (!confirm('Delete this loan?')) return;
    try {
      await loanAPI.delete(id);
      toast.success('Loan deleted');
      const res = await loanAPI.getAll({ page: 1, limit: 50 });
      const mapped = (res.loans || []).map((l: any) => ({
        id: l._id,
        name: l.loanName,
        type: l.loanType,
        principal: l.principalAmount,
        remainingBalance: l.remainingBalance,
        emiAmount: l.emiAmount,
        interestRate: l.interestRate,
        tenure: l.tenureMonths,
        totalInterest: l.totalInterest,
        remainingTenure: Math.max(0, Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))),
        startDate: l.startDate,
        nextDueDate: l.nextEmiDate,
        installmentDueDay: l.installmentDueDay,
        lender: l.lender,
        icon: l.loanType === 'home' ? Home : l.loanType === 'car' ? Car : CreditCard,
        color: l.loanType === 'home' ? 'bg-blue-500' : l.loanType === 'car' ? 'bg-purple-500' : 'bg-orange-500',
        penaltyRate: 0,
        terms: [],
        paymentHistory: (l.payments || []).map((p: any, idx: number) => ({ id: idx + 1, date: p.paymentDate, amount: p.amount, status: 'paid', notes: p.notes || '', emiNumber: p.emiNumber }))
      }));
      setLoans(mapped);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete loan');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    
    try {
      // Simple payment tracking - just record the date and notes
      const payload: any = {
        amount: selectedLoan.emiAmount, // Use the expected EMI amount
        paymentDate: new Date(paymentData.date).toISOString(),
      };

      if (paymentData.notes.trim()) {
        payload.notes = paymentData.notes.trim();
      }



      await loanAPI.recordPayment(selectedLoan.id, payload);
      toast.success('Payment recorded successfully');
      
      setShowAddPayment(false);
      setPaymentData({
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      // Reload loans to reflect the payment
      const res = await loanAPI.getAll({ page: 1, limit: 50 });
      const mapped = (res.loans || []).map((l: any) => ({
        id: l._id,
        name: l.loanName,
        type: l.loanType,
        principal: l.principalAmount,
        remainingBalance: l.remainingBalance,
        emiAmount: l.emiAmount,
        interestRate: l.interestRate,
        tenure: l.tenureMonths,
        totalInterest: l.totalInterest,
        remainingTenure: Math.max(0, Math.ceil((new Date(l.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))),
        startDate: l.startDate,
        nextDueDate: l.nextEmiDate,
        installmentDueDay: l.installmentDueDay,
        lender: l.lender,
        icon: l.loanType === 'home' ? Home : l.loanType === 'car' ? Car : CreditCard,
        color: l.loanType === 'home' ? 'bg-blue-500' : l.loanType === 'car' ? 'bg-purple-500' : 'bg-orange-500',
        penaltyRate: 0,
        terms: [],
        paymentHistory: (l.payments || []).map((p: any, idx: number) => ({
          id: idx + 1,
          date: p.paymentDate,
          amount: p.amount,
          status: 'paid',
          notes: p.notes || '',
          emiNumber: p.emiNumber
        }))
      }));
      setLoans(mapped);

      // Update selected loan
      const updatedLoan = mapped.find(l => l.id === selectedLoan.id);
      if (updatedLoan) {
        setSelectedLoan(updatedLoan);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payment');
    }
  };

  const resetForm = () => {
    setLoanData({
      type: "",
      name: "",
      principal: "",
      interestRate: "",
      tenure: "",
      startDate: new Date().toISOString().split("T")[0],
      installmentDueDay: new Date().getDate(),
      lender: "",
    });
  };

  const calculateTotalInterest = (
    principal: number,
    rate: number,
    tenure: number
  ) => {
    const monthlyRate = rate / 12 / 100;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1);
    return emi * tenure - principal;
  };

  const calculatePenalty = (loan: any) => {
    const today = new Date();
    const dueDate = new Date(loan.nextDueDate);
    if (today > dueDate) {
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return (loan.emiAmount * loan.penaltyRate / 100) * daysLate;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Analyzer</h1>
          <p className="text-muted-foreground">Manage your loans and optimize EMI payments</p>
        </div>
        <Dialog open={showAddLoan} onOpenChange={setShowAddLoan}>
          <DialogTrigger asChild>
            <Button
              variant="hero"
              className="gap-2"
              onClick={() => resetForm()}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Loan</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLoanId ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
              <DialogDescription>
                Enter your loan details for tracking and analysis
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Loan Type *</Label>
                  <Select
                    value={loanData.type}
                    onValueChange={(value) =>
                      setLoanData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Loan Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Car Loan"
                    value={loanData.name}
                    onChange={(e) => setLoanData((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lender">Lender *</Label>
                  <Input
                    id="lender"
                    placeholder="e.g., HDFC Bank"
                    value={loanData.lender}
                    onChange={(e) => setLoanData((p) => ({ ...p, lender: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Amount *</Label>
                  <Input
                    id="principal"
                    type="number"
                    placeholder="₹ 0"
                    value={loanData.principal}
                    onChange={(e) =>
                      setLoanData((prev) => ({
                        ...prev,
                        principal: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    placeholder="8.5"
                    value={loanData.interestRate}
                    onChange={(e) =>
                      setLoanData((prev) => ({
                        ...prev,
                        interestRate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenure">Tenure (Months) *</Label>
                  <Input
                    id="tenure"
                    type="number"
                    placeholder="240"
                    value={loanData.tenure}
                    onChange={(e) =>
                      setLoanData((prev) => ({
                        ...prev,
                        tenure: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Loan Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={loanData.startDate}
                    onChange={(e) =>
                      setLoanData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installmentDueDay">Monthly Due Date *</Label>
                  <Select
                    value={loanData.installmentDueDay.toString()}
                    onValueChange={(value) =>
                      setLoanData((prev) => ({ ...prev, installmentDueDay: parseInt(value, 10) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select due date" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the day of each month when your EMI is due (1-28)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLoanId ? 'Update Loan' : 'Add Loan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddLoan(false);
                    setEditingLoanId(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Suggestion Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Lightbulb className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>AI Suggestion:</strong> Consider prepaying ₹5,000 extra on
          your personal loan monthly. This could save you ₹18,500 in interest
          and reduce tenure by 8 months.
        </AlertDescription>
      </Alert>

      {/* Lending Recommendations */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            AI-Powered Lending Recommendations
          </CardTitle>
          <CardDescription>
            Personalized insights to optimize your lending strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LendingRecommendations />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Summary & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total EMI</p>
                    <p className="text-2xl font-bold text-danger">
                      ₹{totalEMI.toLocaleString()}
                    </p>
                  </div>
                  <Calculator className="w-8 h-8 text-danger" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      EMI to Income
                    </p>
                    <p className="text-2xl font-bold text-warning">
                      {emiToIncomeRatio.toFixed(1)}%
                    </p>
                  </div>
                  <PieChart className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Loans
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {loans.length}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* EMI Analysis */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                EMI Analysis
              </CardTitle>
              <CardDescription>Your loan payment insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Income</span>
                  <span className="font-medium">
                    ₹{monthlyIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total EMIs</span>
                  <span className="font-medium text-danger">
                    ₹{totalEMI.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Available Income</span>
                  <span className="font-medium text-success">
                    ₹{(monthlyIncome - totalEMI).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">
                    EMI to Income Ratio
                  </span>
                </div>
                <Progress value={emiToIncomeRatio} className="h-3 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {emiToIncomeRatio < 40
                    ? "Healthy ratio"
                    : emiToIncomeRatio < 60
                    ? "High but manageable"
                    : "Consider reducing debt"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Payment Notifications */}
          {loans.length > 0 && (
            <div className="space-y-3">
              {loans
                .filter(loan => loan.nextDueDate)
                .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
                .slice(0, 3) // Show only next 3 upcoming payments
                .map(loan => {
                  const dueDate = new Date(loan.nextDueDate);
                  const today = new Date();
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  let alertVariant: "default" | "destructive" = "default";
                  let alertIcon = Calendar;
                  let alertText = "";
                  
                  if (daysUntilDue < 0) {
                    alertVariant = "destructive";
                    alertIcon = AlertTriangle;
                    alertText = `OVERDUE: Your ${loan.name} EMI of ₹${loan.emiAmount?.toLocaleString()} was due on ${dueDate.toLocaleDateString()}`;
                  } else if (daysUntilDue <= 3) {
                    alertVariant = "default";
                    alertIcon = AlertTriangle;
                    alertText = `URGENT: Your ${loan.name} EMI of ₹${loan.emiAmount?.toLocaleString()} is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`} (${dueDate.toLocaleDateString()})`;
                  } else if (daysUntilDue <= 7) {
                    alertVariant = "default";
                    alertIcon = Calendar;
                    alertText = `Upcoming: Your ${loan.name} EMI of ₹${loan.emiAmount?.toLocaleString()} is due on ${dueDate.toLocaleDateString()}`;
                  } else {
                    return null; // Don't show if more than 7 days away
                  }
                  
                  return (
                    <Alert key={loan.id} variant={alertVariant} className={`
                      ${daysUntilDue < 0 ? 'border-red-200 bg-red-50' : 
                        daysUntilDue <= 3 ? 'border-orange-200 bg-orange-50' : 
                        'border-blue-200 bg-blue-50'}
                    `}>
                      {daysUntilDue < 0 ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : daysUntilDue <= 3 ? (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      )}
                      <AlertDescription className={`font-medium ${
                        daysUntilDue < 0 ? 'text-red-800' : 
                        daysUntilDue <= 3 ? 'text-orange-800' : 
                        'text-blue-800'
                      }`}>
                        {alertText}
                      </AlertDescription>
                    </Alert>
                  );
                })}
            </div>
          )}

          {/* Loan Cards */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Loans</h3>
            {loans.map((loan) => (
              <Card key={loan.id} className="shadow-card border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${loan.color} flex items-center justify-center`}
                      >
                        <loan.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{loan.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Next EMI:{" "}
                          {new Date(loan.nextDueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due: {loan.installmentDueDay ? `${loan.installmentDueDay}${loan.installmentDueDay === 1 ? 'st' : loan.installmentDueDay === 2 ? 'nd' : loan.installmentDueDay === 3 ? 'rd' : 'th'} of each month` : 'Monthly'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline">{loan.interestRate}% p.a.</Badge>
                      {loan.lender && (
                        <span className="text-xs text-muted-foreground">{loan.lender}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">EMI Amount</p>
                      <p className="font-semibold text-lg">
                        ₹{loan.emiAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="font-semibold text-lg">
                        ₹{(loan.remainingBalance / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Remaining Tenure
                      </p>
                      <p className="font-semibold text-lg">
                        {loan.remainingTenure} months
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Interest</p>
                      <p className="font-semibold text-lg">
                        ₹{((loan.totalInterest ?? calculateTotalInterest(loan.principal, loan.interestRate, loan.tenure)) / 100000).toFixed(1)}L
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        Paid: ₹
                        {(
                          (loan.principal - loan.remainingBalance) /
                          100000
                        ).toFixed(1)}
                        L
                      </span>
                      <span>Total: ₹{(loan.principal / 100000).toFixed(1)}L</span>
                    </div>
                    <Progress
                      value={
                        ((loan.principal - loan.remainingBalance) /
                          loan.principal) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowLoanDetails(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowPaymentLogs(true);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Track Payments
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const data = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"}/loans/${loan.id}/installments`, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem("ds_auth_token")}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          if (!data.ok) throw new Error('Failed to fetch installments');
                          const installments = await data.json();
                          setInstallmentData(installments);
                          setSelectedLoan(loan);
                          setShowInstallmentSchedule(true);
                        } catch (err: any) {
                          toast.error(err?.message || 'Failed to load installment data');
                        }
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Schedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditLoan(loan)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => deleteLoan(loan.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column - Quick Tips */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Smart Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                <p className="text-sm font-medium text-success mb-1">
                  Prepayment Strategy
                </p>
                <p className="text-xs text-muted-foreground">
                  Prioritize high-interest personal loan for prepayment to
                  save maximum interest.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">
                  Tax Benefits
                </p>
                <p className="text-xs text-muted-foreground">
                  Home loan interest eligible for ₹2L deduction under Section
                  24(b).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <p className="text-sm font-medium text-warning mb-1">
                  Emergency Fund
                </p>
                <p className="text-xs text-muted-foreground">
                  Maintain 6 months EMI amount as emergency fund before
                  aggressive prepayment.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Loan Summary Preview */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
              <CardDescription>Overview of your loan portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Principal</span>
                  <span className="font-medium">
                    ₹{loans.reduce((sum, loan) => sum + loan.principal, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Outstanding</span>
                  <span className="font-medium">
                    ₹{loans.reduce((sum, loan) => sum + loan.remainingBalance, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Interest Paid</span>
                  <span className="font-medium">
                    ₹{loans.reduce((sum, loan) => sum + (loan.principal - loan.remainingBalance), 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between font-semibold">
                    <span>Total EMI</span>
                    <span className="text-danger">₹{totalEMI.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loan Details Modal */}
      <Dialog open={showLoanDetails} onOpenChange={setShowLoanDetails}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {selectedLoan?.icon && <selectedLoan.icon className="w-6 h-6" />}
              {selectedLoan?.name} - Loan Details
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete information about your loan with smart insights
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-6">
              {/* AI Suggestions */}
              <div className="space-y-3">
                <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong className="text-primary">AI Suggestion:</strong>{" "}
                    {calculatePenalty(selectedLoan) > 0 ? (
                      <>
                        Your EMI is overdue by {Math.floor((new Date().getTime() - new Date(selectedLoan.nextDueDate).getTime()) / (1000 * 60 * 60 * 24))} days. 
                        Pay ₹{selectedLoan.emiAmount.toLocaleString()} by today to avoid additional penalty charges of ₹{calculatePenalty(selectedLoan).toLocaleString()}.
                      </>
                    ) : (
                      <>
                        Your next EMI of ₹{selectedLoan.emiAmount.toLocaleString()} is due on {new Date(selectedLoan.nextDueDate).toLocaleDateString()}. 
                        Consider paying 3-5 days early to avoid any late payment penalties.
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                {selectedLoan.interestRate > 10 && (
                  <Alert className="border-warning/20 bg-gradient-to-r from-warning/5 to-orange-50">
                    <TrendingUp className="h-5 w-5 text-warning" />
                    <AlertDescription className="text-sm">
                      <strong className="text-warning">High Interest Alert:</strong>{" "}
                      Your {selectedLoan.name} has a high interest rate of {selectedLoan.interestRate}%. 
                      Consider prepaying ₹{Math.round(selectedLoan.emiAmount * 0.5).toLocaleString()} extra monthly to save ₹{Math.round(calculateTotalInterest(selectedLoan.principal, selectedLoan.interestRate, selectedLoan.tenure) * 0.15 / 100000).toFixed(1)}L in interest.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Hero Section with Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                        {selectedLoan.interestRate}% p.a.
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-blue-900 mb-1">
                      ₹{(selectedLoan.principal / 100000).toFixed(1)}L
                    </h3>
                    <p className="text-blue-700 font-medium">Principal Amount</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-green-200 text-green-800">
                        {((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-green-900 mb-1">
                      ₹{((selectedLoan.principal - selectedLoan.remainingBalance) / 100000).toFixed(1)}L
                    </h3>
                    <p className="text-green-700 font-medium">Amount Paid</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                        {selectedLoan.remainingTenure} months
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-orange-900 mb-1">
                      ₹{(selectedLoan.remainingBalance / 100000).toFixed(1)}L
                    </h3>
                    <p className="text-orange-700 font-medium">Outstanding Balance</p>
                  </CardContent>
                </Card>
              </div>

              {/* Loan Progress Visualization */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Loan Progress Overview
                  </CardTitle>
                  <CardDescription>Visual representation of your loan completion status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Main Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Loan Completion</span>
                      <span className="text-lg font-bold text-primary">
                        {((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal) * 100}
                        className="h-4 bg-gray-100"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow">
                          ₹{((selectedLoan.principal - selectedLoan.remainingBalance) / 100000).toFixed(1)}L / ₹{(selectedLoan.principal / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Principal Paid</span>
                        <span className="ml-auto text-sm font-bold">
                          ₹{((selectedLoan.principal - selectedLoan.remainingBalance) / 100000).toFixed(1)}L
                        </span>
                      </div>
                      <Progress
                        value={((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal) * 100}
                        className="h-2 bg-blue-100"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Interest Paid</span>
                        <span className="ml-auto text-sm font-bold">
                          ₹{(calculateTotalInterest(selectedLoan.principal, selectedLoan.interestRate, selectedLoan.tenure) * 
                            ((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal) / 100000).toFixed(1)}L
                        </span>
                      </div>
                      <Progress
                        value={((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal) * 100}
                        className="h-2 bg-green-100"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium">Remaining</span>
                        <span className="ml-auto text-sm font-bold">
                          ₹{(selectedLoan.remainingBalance / 100000).toFixed(1)}L
                        </span>
                      </div>
                      <Progress
                        value={(selectedLoan.remainingBalance / selectedLoan.principal) * 100}
                        className="h-2 bg-orange-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline and Key Dates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Loan Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 rounded-lg">
                        
                        <div className="flex-1">
                          <p className="font-medium ">Loan Started</p>
                          <p className="text-sm ">{new Date(selectedLoan.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-3  rounded-lg">
                      
                        <div className="flex-1">
                          <p className="font-medium ">Next EMI Due</p>
                          <p className="text-sm ">{new Date(selectedLoan.nextDueDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-3 rounded-lg">
                        
                        <div className="flex-1">
                          <p className="font-medium ">Expected Completion</p>
                          <p className="text-sm">
                            {new Date(new Date(selectedLoan.startDate).getTime() + (selectedLoan.tenure * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interest Analysis */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      Interest Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Total Interest Payable</span>
                        <span className="font-bold text-lg text-red-600">
                          ₹{(calculateTotalInterest(selectedLoan.principal, selectedLoan.interestRate, selectedLoan.tenure) / 100000).toFixed(1)}L
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Interest Paid So Far</span>
                        <span className="font-bold text-lg text-green-600">
                          ₹{(calculateTotalInterest(selectedLoan.principal, selectedLoan.interestRate, selectedLoan.tenure) * 
                            ((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal) / 100000).toFixed(1)}L
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="font-medium">Remaining Interest</span>
                        <span className="font-bold text-lg text-orange-600">
                          ₹{(calculateTotalInterest(selectedLoan.principal, selectedLoan.interestRate, selectedLoan.tenure) * 
                            (selectedLoan.remainingBalance / selectedLoan.principal) / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>

                    {/* Interest Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Interest Paid</span>
                        <span>{((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={((selectedLoan.principal - selectedLoan.remainingBalance) / selectedLoan.principal) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Penalty Alert */}
              {calculatePenalty(selectedLoan) > 0 && (
                <Card className="shadow-lg border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-2">Payment Overdue</h3>
                        <p className="text-red-700 mb-3">
                          Your EMI payment is overdue. A penalty of <strong>₹{calculatePenalty(selectedLoan).toLocaleString()}</strong> has been charged.
                          Please make the payment immediately to avoid additional charges.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terms & Conditions */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLoan.terms.map((term: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <span className="text-sm leading-relaxed">{term}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Logs Modal */}
      <Dialog open={showPaymentLogs} onOpenChange={setShowPaymentLogs}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedLoan?.name} - Payment Logs
            </DialogTitle>
            <DialogDescription>
              Track your payment history and add new payments
            </DialogDescription>
          </DialogHeader>
          
          {selectedLoan && (
            <div className="space-y-6">
              {/* Add Payment Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment History</h3>
                <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mark EMI as Paid</DialogTitle>
                      <DialogDescription>
                        Record when you paid your EMI for {selectedLoan.name}. Expected amount: ₹{selectedLoan.emiAmount?.toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">₹</span>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-900">EMI Amount: ₹{selectedLoan.emiAmount?.toLocaleString()}</p>
                            <p className="text-sm text-blue-700">This amount will be automatically recorded</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paymentDate">When did you pay? *</Label>
                        <Input
                          id="paymentDate"
                          type="date"
                          value={paymentData.date}
                          onChange={(e) =>
                            setPaymentData((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                        <Textarea
                          id="paymentNotes"
                          placeholder="Add any notes about this payment..."
                          value={paymentData.notes}
                          onChange={(e) =>
                            setPaymentData((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          Mark as Paid
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddPayment(false);
                            setPaymentData({
                              date: new Date().toISOString().split("T")[0],
                              notes: "",
                            });
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Payment History Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>EMI #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLoan.paymentHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No payment records found. Add your first payment above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedLoan.paymentHistory
                          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              #{payment.emiNumber || 'Auto'}
                            </TableCell>
                            <TableCell>
                              {new Date(payment.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₹{payment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                // Calculate if payment was made on time
                                const paymentDate = new Date(payment.date);
                                const emiNumber = payment.emiNumber || 1;
                                
                                // Find the corresponding EMI due date (assuming monthly payments)
                                const loanStartDate = new Date(selectedLoan.startDate);
                                const expectedDueDate = new Date(loanStartDate);
                                expectedDueDate.setMonth(loanStartDate.getMonth() + emiNumber);
                                expectedDueDate.setDate(selectedLoan.installmentDueDay || loanStartDate.getDate());
                                
                                const daysLate = Math.ceil((paymentDate.getTime() - expectedDueDate.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (daysLate <= 0) {
                                  return (
                                    <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200">
                                      <CheckCircle className="w-3 h-3" />
                                      On Time
                                    </Badge>
                                  );
                                } else if (daysLate <= 5) {
                                  return (
                                    <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                                      <Clock className="w-3 h-3" />
                                      {daysLate}d Late
                                    </Badge>
                                  );
                                } else {
                                  return (
                                    <Badge variant="destructive" className="gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {daysLate}d Overdue
                                    </Badge>
                                  );
                                }
                              })()}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {payment.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="font-semibold text-lg">
                      ₹{selectedLoan.paymentHistory.reduce((sum: number, payment: any) => sum + payment.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payments Made</p>
                    <p className="font-semibold text-lg">
                      {selectedLoan.paymentHistory.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Payment</p>
                    <p className="font-semibold text-lg">
                      {selectedLoan.paymentHistory.length > 0 
                        ? new Date(selectedLoan.paymentHistory[0].date).toLocaleDateString()
                        : 'No payments'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Due</p>
                    <p className="font-semibold text-lg">
                      {new Date(selectedLoan.nextDueDate).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Installment Schedule Modal */}
      <Dialog open={showInstallmentSchedule} onOpenChange={setShowInstallmentSchedule}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedLoan?.name} - Installment Schedule
            </DialogTitle>
            <DialogDescription>
              Complete EMI schedule with due dates and payment status
            </DialogDescription>
          </DialogHeader>
          
          {installmentData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{installmentData.summary?.paid || 0}</p>
                      <p className="text-sm text-muted-foreground">Paid EMIs</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{installmentData.summary?.pending || 0}</p>
                      <p className="text-sm text-muted-foreground">Pending EMIs</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{installmentData.summary?.overdue || 0}</p>
                      <p className="text-sm text-muted-foreground">Overdue EMIs</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{installmentData.summary?.completionPercentage || 0}%</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Due Dates */}
              {installmentData.upcomingDueDates && installmentData.upcomingDueDates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming Due Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {installmentData.upcomingDueDates.slice(0, 3).map((emi: any) => (
                        <div key={emi.emiNumber} className={`p-4 rounded-lg border ${
                          emi.status === 'overdue' ? 'border-red-200 bg-red-50' :
                          emi.daysUntilDue <= 3 ? 'border-orange-200 bg-orange-50' :
                          'border-blue-200 bg-blue-50'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">EMI #{emi.emiNumber}</span>
                            <Badge variant={
                              emi.status === 'overdue' ? 'destructive' :
                              emi.daysUntilDue <= 3 ? 'secondary' : 'default'
                            }>
                              {emi.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Due: {new Date(emi.dueDate).toLocaleDateString()}
                          </p>
                          <p className="font-medium">₹{emi.amount?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {emi.status === 'overdue' 
                              ? `${emi.daysOverdue} days overdue`
                              : `${emi.daysUntilDue} days remaining`
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full EMI Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Complete EMI Schedule</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead>EMI #</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Interest</TableHead>
                          <TableHead>EMI Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {installmentData.emiSchedule?.map((emi: any) => (
                          <TableRow key={emi.emiNumber} className={
                            emi.status === 'paid' ? 'bg-green-50' :
                            emi.status === 'overdue' ? 'bg-red-50' :
                            emi.status === 'pending' ? 'bg-orange-50' : ''
                          }>
                            <TableCell className="font-medium">#{emi.emiNumber}</TableCell>
                            <TableCell>
                              {new Date(emi.dueDate).toLocaleDateString()}
                              <div className="text-xs text-muted-foreground">
                                {emi.dueDateDay ? `${emi.dueDateDay}${emi.dueDateDay === 1 ? 'st' : emi.dueDateDay === 2 ? 'nd' : emi.dueDateDay === 3 ? 'rd' : 'th'}` : ''}
                              </div>
                            </TableCell>
                            <TableCell>₹{emi.principalAmount?.toLocaleString()}</TableCell>
                            <TableCell>₹{emi.interestAmount?.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">₹{emi.emiAmount?.toLocaleString()}</TableCell>
                            <TableCell>₹{(emi.remainingBalance / 100000)?.toFixed(1)}L</TableCell>
                            <TableCell>
                              <Badge variant={
                                emi.status === 'paid' ? 'default' :
                                emi.status === 'overdue' ? 'destructive' :
                                emi.status === 'pending' ? 'secondary' : 'outline'
                              }>
                                {emi.status}
                              </Badge>
                              {emi.status === 'overdue' && emi.daysOverdue > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  {emi.daysOverdue} days late
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanAnalyzer;