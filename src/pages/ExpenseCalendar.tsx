import { useState, useEffect } from "react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Gamepad2,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Clock,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Transaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  time: string;
  createdAt: Date;
}

interface TransactionFormData {
  amount: string;
  category: string;
  description: string;
  date: string;
  time: string;
}

const ExpenseCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState("");
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: "",
    category: "",
    description: "",
    date: "",
    time: ""
  });
  const [nextId, setNextId] = useState(12); // Start from next available ID

  // Initialize transactions state with mock data
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, amount: 1200, category: "food", description: "Lunch with friends", date: "2024-01-01", time: "14:30", createdAt: new Date() },
    { id: 2, amount: 300, category: "transport", description: "Uber ride", date: "2024-01-01", time: "18:45", createdAt: new Date() },
    { id: 3, amount: 2500, category: "shopping", description: "Groceries", date: "2024-01-02", time: "10:15", createdAt: new Date() },
    { id: 4, amount: 800, category: "entertainment", description: "Movie tickets", date: "2024-01-03", time: "19:00", createdAt: new Date() },
    { id: 5, amount: 150, category: "food", description: "Coffee", date: "2024-01-03", time: "11:30", createdAt: new Date() },
    { id: 6, amount: 3200, category: "bills", description: "Electricity bill", date: "2024-01-05", time: "09:00", createdAt: new Date() },
    { id: 7, amount: 500, category: "food", description: "Breakfast", date: "2024-01-08", time: "08:30", createdAt: new Date() },
    { id: 8, amount: 1800, category: "shopping", description: "Clothing", date: "2024-01-08", time: "16:20", createdAt: new Date() },
    { id: 9, amount: 250, category: "transport", description: "Bus fare", date: "2024-01-12", time: "07:45", createdAt: new Date() },
    { id: 10, amount: 1500, category: "food", description: "Dinner date", date: "2024-01-15", time: "20:00", createdAt: new Date() },
    { id: 11, amount: 600, category: "entertainment", description: "Concert tickets", date: "2024-01-15", time: "14:30", createdAt: new Date() }
  ]);

  const categoryIcons: { [key: string]: { icon: any; color: string; label: string } } = {
    food: { icon: Utensils, color: "bg-red-500", label: "Food" },
    transport: { icon: Car, color: "bg-orange-500", label: "Transport" },
    shopping: { icon: ShoppingBag, color: "bg-yellow-500", label: "Shopping" },
    bills: { icon: Zap, color: "bg-green-500", label: "Bills" },
    entertainment: { icon: Gamepad2, color: "bg-blue-500", label: "Entertainment" }
  };

  // Get transactions for a specific date
  const getTransactionsForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    return transactions.filter(t => t.date === dateKey);
  };

  // Get total amount for a specific date
  const getDayTotal = (date: Date) => {
    const dayTransactions = getTransactionsForDate(date);
    return dayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  // Get date key in YYYY-MM-DD format
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get current date key
  const getCurrentDateKey = () => {
    return getDateKey(new Date());
  };

  // Initialize form with selected date
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: getDateKey(selectedDate),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    }
  }, [selectedDate]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!showAddExpense && !showEditExpense) {
      setFormData({
        amount: "",
        category: "",
        description: "",
        date: getCurrentDateKey(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setEditingTransaction(null);
    }
  }, [showAddExpense, showEditExpense]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeeklyData = () => {
    const days = getDaysInMonth(currentMonth);
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks.map((week, weekIndex) => {
      const weekTotal = week.reduce((sum, day) => {
        if (day) {
          return sum + getDayTotal(day);
        }
        return sum;
      }, 0);
      
      return {
        weekNumber: weekIndex + 1,
        total: weekTotal,
        average: weekTotal / week.filter(day => day !== null).length
      };
    });
  };

  const monthTotal = getDaysInMonth(currentMonth).reduce((sum, day) => {
    if (day) {
      return sum + getDayTotal(day);
    }
    return sum;
  }, 0);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // CRUD Operations
  const handleAddTransaction = () => {
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    const newTransaction: Transaction = {
      id: nextId,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      createdAt: new Date()
    };

    setTransactions(prev => [...prev, newTransaction]);
    setNextId(prev => prev + 1);
    setShowAddExpense(false);
    
    // Update selected date if adding to a different date
    if (selectedDate && getDateKey(selectedDate) !== formData.date) {
      setSelectedDate(new Date(formData.date));
    }
  };

  const handleEditTransaction = () => {
    if (!editingTransaction || !formData.amount || !formData.category || !formData.description) {
      return;
    }

    setTransactions(prev => prev.map(t => 
      t.id === editingTransaction.id 
        ? { 
            ...t, 
            amount: parseFloat(formData.amount),
            category: formData.category,
            description: formData.description,
            date: formData.date,
            time: formData.time
          }
        : t
    ));

    setShowEditExpense(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = () => {
    if (!deletingTransaction) return;

    setTransactions(prev => prev.filter(t => t.id !== deletingTransaction.id));
    setShowDeleteConfirm(false);
    setDeletingTransaction(null);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      time: transaction.time
    });
    setShowEditExpense(true);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  const handleQuickAdd = (date: Date) => {
    if (quickAddAmount && parseFloat(quickAddAmount) > 0) {
      const newTransaction: Transaction = {
        id: nextId,
        amount: parseFloat(quickAddAmount),
        category: "food", // Default category for quick add
        description: "Quick expense",
        date: getDateKey(date),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date()
      };

      setTransactions(prev => [...prev, newTransaction]);
      setNextId(prev => prev + 1);
      setQuickAddAmount("");
      
      // Select the date if not already selected
      if (!selectedDate || getDateKey(selectedDate) !== getDateKey(date)) {
        setSelectedDate(date);
      }
    }
  };

  const handleFormChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Calendar</h1>
          <p className="text-muted-foreground">Visual overview of your daily spending patterns</p>
        </div>
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogTrigger asChild>
            <Button variant="hero" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Record a new expense for the selected date</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryIcons).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What was this expense for?"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="hero" 
                  onClick={handleAddTransaction}
                  disabled={!formData.amount || !formData.category || !formData.description}
                >
                  Add Expense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar - Takes 3 columns */}
        <div className="lg:col-span-3">
          <Card className="shadow-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Click on any date to view detailed transactions.
              </CardDescription>
              <div className="mt-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Total spent this month:</span>
                  <span className="text-2xl font-bold text-primary">₹{monthTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-2"></div>;
                  }
                  
                  const dayTotal = getDayTotal(date);
                  const hasExpenses = dayTotal > 0;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'border-primary bg-primary/5' : 
                        isToday ? 'border-primary bg-primary/10' : 
                        hasExpenses ? 'border-border bg-surface/50' : 'border-border'
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                          {date.getDate()}
                        </span>
                        {hasExpenses && (
                          <div className="w-2 h-2 rounded-full bg-danger"></div>
                        )}
                      </div>
                      
                      {hasExpenses && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-danger">
                            ₹{dayTotal.toLocaleString()}
                          </div>
                          
                        </div>
                      )}
                      
                      {!hasExpenses && (
                        <div className="flex items-center justify-center mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(date);
                              setShowAddExpense(true);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Details */}
          {selectedDate && (
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </CardTitle>
                <CardDescription>
                  Daily transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {getTransactionsForDate(selectedDate).length > 0 ? (
                  <>
                    {getTransactionsForDate(selectedDate).map((transaction) => (
                      <div key={transaction.id} className="p-3 rounded-lg bg-surface/50 hover:bg-surface/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${categoryIcons[transaction.category]?.color} flex items-center justify-center`}>
                              {categoryIcons[transaction.category] && 
                                React.createElement(categoryIcons[transaction.category].icon, { className: "w-4 h-4 text-white" })
                              }
                            </div>
                            <div>
                              <p className="text-sm font-medium">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {transaction.time}
                              </p>
                            </div>
                          </div>
                                                     <div className="flex items-center gap-2">
                             <span className="font-medium text-danger">₹{transaction.amount}</span>
                             <div className="flex gap-1">
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-6 w-6 p-0 hover:bg-primary/10"
                                 onClick={() => openEditDialog(transaction)}
                               >
                                 <Edit className="w-3 h-3" />
                               </Button>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                 onClick={() => openDeleteDialog(transaction)}
                               >
                                 <Trash2 className="w-3 h-3" />
                               </Button>
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Day Total:</span>
                        <span className="font-bold text-danger">₹{getDayTotal(selectedDate).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No expenses for this day</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddExpense(true)}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Expense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditExpense} onOpenChange={setShowEditExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the expense details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount (₹)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryIcons).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleFormChange('time', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditExpense(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero" 
                onClick={handleEditTransaction}
                disabled={!formData.amount || !formData.category || !formData.description}
              >
                Update Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deletingTransaction && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${categoryIcons[deletingTransaction.category]?.color} flex items-center justify-center`}>
                      {categoryIcons[deletingTransaction.category] && 
                        React.createElement(categoryIcons[deletingTransaction.category].icon, { className: "w-4 h-4 text-white" })
                      }
                    </div>
                    <div>
                      <p className="font-medium">{deletingTransaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{deletingTransaction.amount} • {deletingTransaction.date}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteTransaction}
              >
                Delete Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseCalendar;