import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { loanAPI } from "@/lib/api";
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  RefreshCw,
  IndianRupee
} from "lucide-react";

type LoanStatus = 'active' | 'completed' | 'defaulted' | 'prepaid';

interface Loan {
  _id: string;
  loanType: string;
  loanName: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalAmount: number;
  totalInterest: number;
  startDate: string;
  endDate: string;
  lender: string;
  loanAccountNumber?: string;
  status: LoanStatus;
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
  totalPaid: number;
  remainingBalance: number;
  nextEmiDate: string;
  nextEmiAmount: number;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface LoanFormData {
  loanType: 'personal' | 'home' | 'car' | 'education' | 'business' | 'gold' | 'other';
  loanName: string;
  principalAmount: string;
  interestRate: string;
  tenureMonths: string;
  lender: string;
  startDate: string;
  loanAccountNumber: string;
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
  description: string;
  tags: string;
}

const LOAN_TYPES: LoanFormData['loanType'][] = ['personal', 'home', 'car', 'education', 'business', 'gold', 'other'];
const PAYMENT_FREQUENCIES: LoanFormData['paymentFrequency'][] = ['monthly', 'quarterly', 'yearly'];

const LoanManager = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | LoanStatus>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [formData, setFormData] = useState<LoanFormData>({
    loanType: 'personal',
    loanName: '',
    principalAmount: '',
    interestRate: '',
    tenureMonths: '',
    lender: '',
    startDate: new Date().toISOString().split('T')[0],
    loanAccountNumber: '',
    paymentFrequency: 'monthly',
    description: '',
    tags: ''
  });

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await loanAPI.getAll(params);
      setLoans(res.loans || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      loanType: 'personal',
      loanName: '',
      principalAmount: '',
      interestRate: '',
      tenureMonths: '',
      lender: '',
      startDate: new Date().toISOString().split('T')[0],
      loanAccountNumber: '',
      paymentFrequency: 'monthly',
      description: '',
      tags: ''
    });
    setEditingLoan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        loanType: formData.loanType,
        loanName: formData.loanName.trim(),
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate),
        tenureMonths: parseInt(formData.tenureMonths, 10),
        lender: formData.lender.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        loanAccountNumber: formData.loanAccountNumber || undefined,
        paymentFrequency: formData.paymentFrequency,
        description: formData.description || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      if (!payload.loanName || isNaN(payload.principalAmount) || isNaN(payload.interestRate) || isNaN(payload.tenureMonths)) {
        toast.error('Please fill all required fields correctly');
        return;
      }

      if (editingLoan) {
        await loanAPI.update(editingLoan._id, payload as any);
        toast.success('Loan updated');
      } else {
        await loanAPI.create(payload as any);
        toast.success('Loan created');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchLoans();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save loan');
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      loanType: loan.loanType as LoanFormData['loanType'],
      loanName: loan.loanName,
      principalAmount: String(loan.principalAmount),
      interestRate: String(loan.interestRate),
      tenureMonths: String(loan.tenureMonths),
      lender: loan.lender,
      startDate: new Date(loan.startDate).toISOString().split('T')[0],
      loanAccountNumber: loan.loanAccountNumber || '',
      paymentFrequency: loan.paymentFrequency,
      description: loan.description || '',
      tags: (loan.tags || []).join(', ')
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this loan?')) return;
    try {
      await loanAPI.delete(id);
      toast.success('Loan deleted');
      fetchLoans();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete loan');
    }
  };

  const filteredLoans = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return loans;
    return loans.filter(l =>
      l.loanName.toLowerCase().includes(q) ||
      l.lender.toLowerCase().includes(q) ||
      l.loanType.toLowerCase().includes(q)
    );
  }, [searchTerm, loans]);

  const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Loan Manager</h1>
          <p className="text-muted-foreground">Create and track your loans, EMIs and payments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add Loan'}</DialogTitle>
              <DialogDescription>Enter loan details. EMI will be auto-calculated by backend.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loan Type</Label>
                  <Select value={formData.loanType} onValueChange={(v: any) => setFormData({ ...formData, loanType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map(t => <SelectItem key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loan Name</Label>
                  <Input value={formData.loanName} onChange={e => setFormData({ ...formData, loanName: e.target.value })} placeholder="e.g., Home Loan" required />
                </div>
                <div className="space-y-2">
                  <Label>Principal Amount</Label>
                  <Input type="number" min="0" value={formData.principalAmount} onChange={e => setFormData({ ...formData, principalAmount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (% p.a.)</Label>
                  <Input type="number" min="0" step="0.01" value={formData.interestRate} onChange={e => setFormData({ ...formData, interestRate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tenure (months)</Label>
                  <Input type="number" min="1" value={formData.tenureMonths} onChange={e => setFormData({ ...formData, tenureMonths: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Lender</Label>
                  <Input value={formData.lender} onChange={e => setFormData({ ...formData, lender: e.target.value })} placeholder="Bank / Institution" required />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Payment Frequency</Label>
                  <Select value={formData.paymentFrequency} onValueChange={(v: any) => setFormData({ ...formData, paymentFrequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f[0].toUpperCase()+f.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Account Number (optional)</Label>
                  <Input value={formData.loanAccountNumber} onChange={e => setFormData({ ...formData, loanAccountNumber: e.target.value })} placeholder="Loan account number" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description (optional)</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Notes about this loan" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="home, emi, sbi" />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingLoan ? 'Update Loan' : 'Add Loan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5" /> Loans
          </CardTitle>
          <CardDescription>Manage your loans. Click edit to update, trash to delete.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search loans by name, lender, type" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
                <SelectItem value="prepaid">Prepaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchLoans}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading loans...
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No loans found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLoans.map(loan => (
                <div key={loan._id} className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{loan.loanName}</h3>
                      <Badge variant="outline" className="capitalize">{loan.loanType}</Badge>
                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="capitalize">{loan.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                      <span>EMI: {formatINR(loan.emiAmount)}</span>
                      <span>Principal: {formatINR(loan.principalAmount)}</span>
                      <span>Rate: {loan.interestRate}%</span>
                      <span>Tenure: {loan.tenureMonths}m</span>
                      <span>Lender: {loan.lender}</span>
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Next EMI: {formatDate(loan.nextEmiDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(loan)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(loan._id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanManager;


