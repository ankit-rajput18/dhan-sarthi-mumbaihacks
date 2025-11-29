import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  Trash2
} from "lucide-react";
import { transactionAPI, lendPersonAPI } from '@/lib/api';
import { toast } from 'sonner';
import TransactionModal from '@/components/TransactionModal';

// Define the full Transaction interface to match what TransactionModal expects
interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  tags: string[];
  location?: string;
  paymentMethod: string;
  recurring: {
    isRecurring: boolean;
    frequency: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Define a simplified interface for our calendar view
interface CalendarTransaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  time: string;
  createdAt: Date;
}

const ExpenseCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<CalendarTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for TransactionModal
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<'add' | 'edit'>('add');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Keep these states for the people management functionality
  const [savedPeople, setSavedPeople] = useState<string[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  
  const [quickAddAmount, setQuickAddAmount] = useState("");

  // Categories for expenses
  const expenseCategories = [
    "food", "transport", "shopping", "bills", "entertainment", 
    "healthcare", "education", "travel", "lend", "other-expense"
  ];

  // Payment methods
  const paymentMethods = ["cash", "card", "upi", "netbanking", "wallet", "other"];

  // Frequencies for recurring expenses
  const frequencies = ["daily", "weekly", "monthly", "yearly"];

  useEffect(() => {
    fetchTransactions();
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      setLoadingPeople(true);
      const response = await lendPersonAPI.getAll();
      setSavedPeople(response.people || []);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoadingPeople(false);
    }
  };

  const handleAddPerson = async () => {
    if (newPersonName.trim()) {
      try {
        await lendPersonAPI.add(newPersonName.trim());
        await fetchPeople();
        setNewPersonName('');
        setIsAddingPerson(false);
        toast.success('Person added successfully');
      } catch (error: any) {
        console.error('Error adding person:', error);
        toast.error(error.message || 'Failed to add person');
      }
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch all expense transactions with a higher limit to get more data
      const response = await transactionAPI.getAll({ type: 'expense', limit: 100 });
      // Transform API response to match component's expected format
      // Use local date formatting instead of UTC to avoid timezone issues
      const transformedTransactions = response.transactions.map((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return {
          id: transaction._id,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: getDateKey(transactionDate), // Use local date instead of UTC
          time: transactionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(transaction.createdAt)
        };
      });
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
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

  // Debug function to log amounts
  const debugDayTotal = (date: Date, total: number) => {
    // console.log(`Date: ${date.toDateString()}, Total: ${total}, Formatted: ${formatCompactAmount(total)}`);
    return total;
  };

  // Get date key in YYYY-MM-DD format (using local timezone instead of UTC)
  const getDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format amount for compact display
  const formatCompactAmount = (amount: number) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    } else {
      // For very small amounts, ensure we show at least something
      return amount > 0 ? amount.toString() : '0';
    }
  };

  // Get current date key
  const getCurrentDateKey = () => {
    return getDateKey(new Date());
  };

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

  // Create a function to handle opening the modal for adding a new expense
  const openAddExpenseModal = () => {
    setTransactionModalMode('add');
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  // Create a function to handle opening the modal for editing an expense
  const openEditExpenseModal = async (calendarTransaction: CalendarTransaction) => {
    try {
      // Fetch the full transaction details for editing
      const response = await transactionAPI.getById(calendarTransaction.id);
      setTransactionModalMode('edit');
      setEditingTransaction(response.transaction);
      setIsTransactionModalOpen(true);
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      toast.error("Failed to load transaction details");
    }
  };

  // Handle successful transaction submission
  const handleTransactionSubmit = async (transactionData: any) => {
    try {
      if (transactionModalMode === 'add') {
        // Ensure type is set to expense for calendar
        transactionData.type = 'expense';
        
        const response = await transactionAPI.create(transactionData);
        toast.success("Expense added successfully");
        
        // Add the new transaction to the state
        const newTransaction: CalendarTransaction = {
          id: response.transaction._id,
          amount: response.transaction.amount,
          category: response.transaction.category,
          description: response.transaction.description,
          date: getDateKey(new Date(response.transaction.date)),
          time: new Date(response.transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(response.transaction.createdAt)
        };

        setTransactions(prev => [...prev, newTransaction]);
        
        // Update selected date if adding to a different date
        if (selectedDate && transactionData.date) {
          const transactionDate = new Date(transactionData.date);
          if (getDateKey(selectedDate) !== getDateKey(transactionDate)) {
            setSelectedDate(transactionDate);
          }
        }
      } else if (editingTransaction) {
        const response = await transactionAPI.update(editingTransaction._id, transactionData);
        toast.success("Expense updated successfully");

        // Update the transaction in the state
        const updatedTransaction: CalendarTransaction = {
          id: response.transaction._id,
          amount: response.transaction.amount,
          category: response.transaction.category,
          description: response.transaction.description,
          date: getDateKey(new Date(response.transaction.date)),
          time: new Date(response.transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(response.transaction.createdAt)
        };

        setTransactions(prev => 
          prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
        );
      }

      // Close the modal
      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await transactionAPI.delete(transactionId);
      toast.success("Expense deleted successfully");
      
      // Remove the transaction from the state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast.error(error.message || "Failed to delete expense");
    }
  };

  const handleQuickAdd = async (date: Date) => {
    if (quickAddAmount && parseFloat(quickAddAmount) > 0) {
      try {
        // Use the date directly for quick add
        const transactionData = {
          type: 'expense' as const,
          amount: parseFloat(quickAddAmount),
          category: "food", // Default category for quick add
          description: "Quick expense",
          date: date.toISOString()
        };

        const response = await transactionAPI.create(transactionData);
        toast.success("Expense added successfully");
        
        // Add the new transaction to the state
        const newTransaction: CalendarTransaction = {
          id: response.transaction._id,
          amount: response.transaction.amount,
          category: response.transaction.category,
          description: response.transaction.description,
          date: getDateKey(new Date(response.transaction.date)), // Use local date instead of UTC
          time: new Date(response.transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(response.transaction.createdAt)
        };

        setTransactions(prev => [...prev, newTransaction]);
        setQuickAddAmount("");
        
        // Select the date if not already selected
        if (!selectedDate || getDateKey(selectedDate) !== getDateKey(date)) {
          setSelectedDate(date);
        }
      } catch (error: any) {
        console.error("Error adding quick transaction:", error);
        toast.error(error.message || "Failed to add quick expense");
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      food: 'bg-red-100 text-red-800',
      transport: 'bg-orange-100 text-orange-800',
      shopping: 'bg-yellow-100 text-yellow-800',
      bills: 'bg-green-100 text-green-800',
      entertainment: 'bg-blue-100 text-blue-800',
      healthcare: 'bg-pink-100 text-pink-800',
      education: 'bg-purple-100 text-purple-800',
      travel: 'bg-cyan-100 text-cyan-800',
      lend: 'bg-indigo-100 text-indigo-800',
      'other-expense': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      food: '🍽️',
      transport: '🚗',
      shopping: '🛍️',
      bills: '📄',
      entertainment: '🎬',
      healthcare: '🏥',
      education: '📚',
      travel: '✈️',
      lend: '🤝',
      'other-expense': '📦'
    };
    return icons[category] || '💳';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expense Calendar</h1>
        <p className="text-muted-foreground">Track your expenses by date</p>
      </div>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigateMonth('prev')}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigateMonth('next')}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-lg font-bold text-red-600">
                ₹{monthTotal.toLocaleString()}
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Click on a date to view or add expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {getDaysInMonth(currentMonth).map((day, index) => (
              <div 
                key={index} 
                className={`min-h-20 p-1 border rounded-lg cursor-pointer transition-colors ${
                  day 
                    ? selectedDate && getDateKey(day) === getDateKey(selectedDate)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                    : 'bg-muted/50'
                }`}
                onClick={() => day && setSelectedDate(day)}
              >
                {day && (
                  <>
                    <div className="text-right text-sm p-1">
                      {day.getDate()}
                    </div>
                    <div className="text-xs p-1 space-y-1">
                      {getTransactionsForDate(day).slice(0, 2).map(transaction => (
                        <div 
                          key={transaction.id} 
                          className="truncate px-1 py-0.5 bg-red-50 text-red-700 rounded"
                        >
                          ₹{transaction.amount}
                        </div>
                      ))}
                      {getTransactionsForDate(day).length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{getTransactionsForDate(day).length - 2} more
                        </div>
                      )}
                      {getTransactionsForDate(day).length > 0 && (
                        <div className="font-semibold text-xs px-1">
                          ₹{getDayTotal(day).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="border-t pt-4 mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {selectedDate.toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Quick add amount"
                    value={quickAddAmount}
                    onChange={(e) => setQuickAddAmount(e.target.value)}
                    className="w-32"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => handleQuickAdd(selectedDate)}
                    disabled={!quickAddAmount || parseFloat(quickAddAmount) <= 0}
                  >
                    Add
                  </Button>
                  <Button size="sm" onClick={openAddExpenseModal}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expense
                  </Button>
                </div>
              </div>

              {getTransactionsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p>No expenses recorded for this date</p>
                  <p className="text-sm mt-1">Click "Add Expense" to record your first expense</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {getTransactionsForDate(selectedDate).map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Badge variant="secondary" className={getCategoryColor(transaction.category)}>
                                {transaction.category}
                              </Badge>
                              <span>{transaction.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-bold text-red-600">₹{transaction.amount.toLocaleString()}</div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditExpenseModal(transaction)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
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
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Use TransactionModal instead of the custom dialog */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        editingTransaction={editingTransaction}
        initialType="expense"
      />
    </div>
  );
};

export default ExpenseCalendar;