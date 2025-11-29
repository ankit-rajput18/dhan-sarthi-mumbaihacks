import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { transactionAPI, lendPersonAPI } from '@/lib/api';
import { toast } from 'sonner';

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  date: string;
  tags: string;
  location: string;
  paymentMethod: string;
  lendTo: string;
  recurring: {
    isRecurring: boolean;
    frequency: string;
  };
}

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
  lendTo?: string;
  recurring: {
    isRecurring: boolean;
    frequency: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: any) => void;
  editingTransaction?: Transaction | null;
  initialType?: 'income' | 'expense';
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingTransaction,
  initialType = 'expense'
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: initialType,
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    location: '',
    paymentMethod: 'cash',
    lendTo: '',
    recurring: {
      isRecurring: false,
      frequency: 'monthly'
    }
  });

  // Person name management
  const [savedPeople, setSavedPeople] = useState<string[]>([]);
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);

  const categories = {
    income: ['salary', 'freelance', 'investment', 'business', 'other-income'],
    expense: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'healthcare', 'education', 'travel', 'lend', 'other-expense']
  };

  const paymentMethods = ['cash', 'card', 'upi', 'netbanking', 'wallet', 'other'];
  const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];

  const handleAddPerson = async () => {
    if (newPersonName.trim()) {
      try {
        await lendPersonAPI.add(newPersonName.trim());
        await fetchPeople();
        setFormData({ ...formData, lendTo: newPersonName.trim() });
        setNewPersonName('');
        setIsAddingPerson(false);
        toast.success('Person added successfully');
      } catch (error: any) {
        console.error('Error adding person:', error);
        toast.error(error.message || 'Failed to add person');
      }
    }
  };

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

  useEffect(() => {
    if (isOpen) {
      fetchPeople();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        category: editingTransaction.category,
        description: editingTransaction.description,
        date: new Date(editingTransaction.date).toISOString().split('T')[0],
        tags: editingTransaction.tags.join(', '),
        location: editingTransaction.location || '',
        paymentMethod: editingTransaction.paymentMethod,
        lendTo: editingTransaction.lendTo || '',
        recurring: {
          isRecurring: editingTransaction.recurring.isRecurring,
          frequency: editingTransaction.recurring.frequency || 'monthly'
        }
      });
    } else {
      // Reset form when not editing
      setFormData({
        type: initialType,
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        location: '',
        paymentMethod: 'cash',
        lendTo: '',
        recurring: {
          isRecurring: false,
          frequency: 'monthly'
        }
      });
    }
  }, [editingTransaction, isOpen, initialType]);

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      food: '🍽️',
      transport: '🚗',
      shopping: '🛍️',
      bills: '📄',
      entertainment: '🎬',
      healthcare: '🏥',
      education: '📚',
      travel: '✈️',
      lend: '🤝',
      salary: '💰',
      freelance: '💼',
      investment: '📈',
      business: '🏢'
    };
    return iconMap[category] || '💳';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation for lend category
      if (formData.category === 'lend' && !formData.lendTo.trim()) {
        toast.error('Please enter the name of the person you are lending money to');
        return;
      }

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        date: new Date(formData.date).toISOString()
      };

      onSubmit(transactionData);
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction ? 'Update transaction details' : 'Enter the details for your new transaction'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => 
                  setFormData({ ...formData, type: value, category: '' })
                }
                disabled={!!editingTransaction}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[formData.type].map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category === 'lend' && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lendTo">Person Name</Label>
                {!isAddingPerson ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.lendTo}
                      onValueChange={(value) => setFormData({ ...formData, lendTo: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or add person" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedPeople.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No saved people. Click + to add.
                          </div>
                        ) : (
                          savedPeople.map((person, index) => (
                            <SelectItem key={index} value={person}>
                              {person}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (formData.lendTo) {
                          // If there's a selected person, save it
                          setNewPersonName(formData.lendTo);
                          setIsAddingPerson(true);
                        } else {
                          // Otherwise, just switch to add mode
                          setIsAddingPerson(true);
                        }
                      }}
                      title="Add new person"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="Enter person name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPerson();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      onClick={handleAddPerson}
                      disabled={!newPersonName.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setIsAddingPerson(false);
                        setNewPersonName('');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
                {!isAddingPerson && savedPeople.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Click the + button to add people you lend money to
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where did this happen?"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this transaction..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={formData.recurring.isRecurring}
                onCheckedChange={(checked) => 
                  setFormData({ 
                    ...formData, 
                    recurring: { ...formData.recurring, isRecurring: checked }
                  })
                }
              />
              <Label htmlFor="recurring" className="text-sm">This is a recurring transaction</Label>
            </div>

            {formData.recurring.isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.recurring.frequency}
                  onValueChange={(value) => 
                    setFormData({ 
                      ...formData, 
                      recurring: { ...formData.recurring, frequency: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;