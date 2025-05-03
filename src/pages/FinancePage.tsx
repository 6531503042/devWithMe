import React, { useEffect, useState } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import TransactionForm from '@/components/finance/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  transaction_categories?: {
    name: string;
    type: string;
  } | null;
};
type Budget = Database['public']['Tables']['budgets']['Row'];
type TransactionCategory = Database['public']['Tables']['transaction_categories']['Row'];

// Mock data for development mode
const mockAccounts: FinancialAccount[] = [
  {
    id: '1',
    name: 'Main Checking',
    balance: 2540.75,
    currency: 'USD',
    type: 'bank',
    icon: null,
    color: null,
    is_active: true,
    user_id: 'dev-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Savings',
    balance: 12750.00,
    currency: 'USD',
    type: 'bank',
    icon: null,
    color: null,
    is_active: true,
    user_id: 'dev-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'dev-user',
    account_id: '1',
    amount: -45.99,
    type: 'expense',
    category_id: '1',
    date: new Date().toISOString(),
    note: 'Groceries',
    tags: ['food', 'essentials'],
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    transaction_categories: { name: 'Groceries', type: 'expense' }
  },
  {
    id: '2',
    user_id: 'dev-user',
    account_id: '1',
    amount: 1250.00,
    type: 'income',
    category_id: '2',
    date: new Date().toISOString(),
    note: 'Salary',
    tags: ['income', 'work'],
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    transaction_categories: { name: 'Salary', type: 'income' }
  }
];

const mockCategories: TransactionCategory[] = [
  {
    id: '1',
    name: 'Groceries',
    type: 'expense',
    icon: '🍎',
    color: '#ef4444',
    is_system: true,
    parent_id: null,
    user_id: null,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Salary',
    type: 'income',
    icon: '💼',
    color: '#10b981',
    is_system: true,
    parent_id: null,
    user_id: null,
    created_at: new Date().toISOString()
  }
];

const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF'];

const FinancePage = () => {
  const { user, devMode } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('cash');
  const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAll();
    } else if (devMode) {
      // Use mock data in development mode
      setAccounts(mockAccounts);
      setTransactions(mockTransactions);
      setCategories(mockCategories);
      setBudgets([]);
      setSelectedAccountId(mockAccounts[0].id);
      setIsLoading(false);
    }
  }, [user, devMode]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      // Accounts
      const { data: accData, error: accErr } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (accErr) throw accErr;
      setAccounts(accData || []);
      if (accData && accData.length > 0 && !selectedAccountId) setSelectedAccountId(accData[0].id);
      // Transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*, transaction_categories(name, type)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (txErr) throw txErr;
      setTransactions(txData || []);
      // Budgets
      const { data: budData, error: budErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (budErr) throw budErr;
      setBudgets(budData || []);
      // Categories
      const { data: catData, error: catErr } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (catErr) throw catErr;
      setCategories(catData || []);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      
      if (devMode) {
        // Use mock data if fetch fails in development mode
        setAccounts(mockAccounts);
        setTransactions(mockTransactions);
        setCategories(mockCategories);
        setBudgets([]);
        if (!selectedAccountId && mockAccounts.length > 0) {
          setSelectedAccountId(mockAccounts[0].id);
        }
      } else {
        toast({ title: 'Error', description: 'Failed to load finance data', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add Account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    
    if (devMode && !user) {
      // In development mode without a user, just add to local state
      const newAccount: FinancialAccount = {
        id: Date.now().toString(),
        name: newAccountName.trim(),
        type: newAccountType,
        currency: newAccountCurrency,
        balance: 0,
        is_active: true,
        icon: null,
        color: null,
        user_id: 'dev-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setAccounts(prev => [...prev, newAccount]);
      setNewAccountName('');
      setNewAccountType('cash');
      setNewAccountCurrency('USD');
      setIsAddAccountOpen(false);
      
      if (!selectedAccountId) {
        setSelectedAccountId(newAccount.id);
      }
      
      toast({ title: 'Account added (Dev Mode)' });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .insert({
          name: newAccountName.trim(),
          type: newAccountType,
          currency: newAccountCurrency,
          user_id: user.id,
        });
      if (error) throw error;
      setNewAccountName('');
      setNewAccountType('cash');
      setNewAccountCurrency('USD');
      setIsAddAccountOpen(false);
      fetchAll();
      toast({ title: 'Account added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add account', variant: 'destructive' });
    }
  };

  // Stats
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const filteredTx = selectedAccountId ? transactions.filter(t => t.account_id === selectedAccountId) : transactions;
  const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = selectedAccount ? selectedAccount.balance : (totalIncome - totalExpense);

  // Pie chart data
  const expenseByCategory = filteredTx
    .filter(t => t.type === 'expense' && t.transaction_categories)
    .reduce((acc: Record<string, number>, t) => {
      const cat = t.transaction_categories?.name || 'Other';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Math.abs(t.amount);
      return acc;
    }, {});
  const pieChartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // Monthly data (group by month)
  const monthlyDataMap: Record<string, { income: number; expense: number }> = {};
  filteredTx.forEach(t => {
    const month = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyDataMap[month]) monthlyDataMap[month] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyDataMap[month].income += Math.abs(t.amount);
    if (t.type === 'expense') monthlyDataMap[month].expense += Math.abs(t.amount);
  });
  const monthlyData = Object.entries(monthlyDataMap).map(([name, v]) => ({ name, ...v }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedAccount?.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US').format(new Date(date));
  };

  if (isLoading) {
    return <div className="flex flex-col min-h-screen"><AppNavbar /><main className="flex-1"><PageContainer title="Finance Tracker"><div className="py-10 text-center">Loading...</div></PageContainer></main><AppFooter /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      <main className="flex-1">
        <PageContainer title="Finance Tracker">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="account-select">Account:</Label>
              <Select value={selectedAccountId || ''} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setIsAddAccountOpen(true)}>
                + New Account
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              {selectedAccountId && (
                <TransactionForm accountId={selectedAccountId} onSuccess={fetchAll} />
              )}
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Income</div>
                    <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Expenses</div>
                    <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Balance</div>
                    <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(balance)}</div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTx.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-medium capitalize">{transaction.transaction_categories?.name || 'Other'}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(transaction.date)}</div>
                          {transaction.note && <div className="text-xs text-muted-foreground mt-1">{transaction.note}</div>}
                        </div>
                        <div className={`font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, '']} />
                      <Bar dataKey="income" name="Income" fill="#8B5CF6" />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Account Dialog */}
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="e.g. Main Wallet"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account-type">Type</Label>
                  <Select value={newAccountType} onValueChange={setNewAccountType}>
                    <SelectTrigger id="account-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="account-currency">Currency</Label>
                  <Input
                    id="account-currency"
                    value={newAccountCurrency}
                    onChange={(e) => setNewAccountCurrency(e.target.value)}
                    placeholder="USD"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageContainer>
      </main>
      <AppFooter />
    </div>
  );
};

export default FinancePage;
