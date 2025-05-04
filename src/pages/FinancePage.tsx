import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import TransactionForm from '@/components/finance/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CalendarIcon, PiggyBank, Wallet, CreditCard, 
  BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon,
  TrendingUp, TrendingDown, Calendar, Clock, ListFilter, Loader2,
  Edit, Trash2, MoreVertical
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addMonths, isWithinInterval, compareAsc } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Finance data types
type FinancialAccount = Database['public']['Tables']['financial_accounts']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  transaction_categories?: {
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
  } | null;
};
type Budget = Database['public']['Tables']['budgets']['Row'];
type TransactionCategory = Database['public']['Tables']['transaction_categories']['Row'];

// Improved color palette
const COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue 
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#0ea5e9', // Sky
];

// Time period types
type TimePeriod = 'overall' | 'yearly' | 'monthly' | 'weekly';

// Date helpers
const getCurrentMonthDates = () => {
  return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
};

const getCurrentWeekDates = () => {
  return { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) };
};

const getCurrentYearDates = () => {
  return { start: startOfYear(new Date()), end: endOfYear(new Date()) };
};

// Calendar component for monthly view
const FinanceCalendar = ({ transactions, selectedMonth = new Date() }: { 
  transactions: Transaction[], 
  selectedMonth?: Date 
}) => {
  const daysInMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  ).getDate();
  
  // Create array of days in the month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Get transactions for each day
  const transactionsByDay = days.map(day => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const dayStr = format(date, 'yyyy-MM-dd');
    
    const dayTransactions = transactions.filter(t => t.date.startsWith(dayStr));
    
    // Calculate day totals
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      day,
      transactions: dayTransactions,
      income,
      expense,
      net: income - expense,
      count: dayTransactions.length
    };
  });

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
  // Adjust to make Monday the first day of week (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  // Calculate empty cells at the beginning
  const emptyCells = Array.from({ length: adjustedFirstDay }, (_, i) => i);
  
  // Days of week header (starting with Monday)
  const daysOfWeek = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

  return (
    <div className="bg-white rounded-md shadow-sm border overflow-x-auto">
      <div className="p-4 border-b">
        <h3 className="font-medium">{format(selectedMonth, 'MMMM yyyy')}</h3>
        <p className="text-sm text-muted-foreground">
          {transactionsByDay.reduce((sum, day) => sum + day.count, 0)} transactions
        </p>
      </div>
      <div className="grid grid-cols-7 border-b min-w-[350px]">
        {daysOfWeek.map((day, index) => (
          <div key={index} className="text-center py-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-w-[350px]">
        {/* Empty cells for days before the 1st of month */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square p-1 border-r border-b bg-muted/20"></div>
        ))}
        
        {/* Actual days of month */}
        {transactionsByDay.map(({ day, income, expense, net, count }) => (
          <div 
            key={day} 
            className={`
              aspect-square p-1 border-r border-b relative
              ${count > 0 ? 'hover:bg-muted/10 cursor-pointer' : ''}
              ${new Date().getDate() === day && 
                new Date().getMonth() === selectedMonth.getMonth() && 
                new Date().getFullYear() === selectedMonth.getFullYear() 
                ? 'bg-primary/5' : ''}
            `}
          >
            <div className="absolute top-1 left-1 text-xs font-medium">{day}</div>
            
            {count > 0 && (
              <div className="absolute bottom-1 right-1 flex flex-col items-end">
                <div className={`text-xs font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {net === 0 ? '' : net > 0 ? '+' : '-'}
                  {Math.abs(net).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {count} {count === 1 ? 'item' : 'items'}
                </div>
              </div>
            )}
            
            {/* Indicator for transactions */}
            {income > 0 && (
              <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500"></div>
            )}
            {expense > 0 && (
              <div className="absolute top-1 right-3 h-1.5 w-1.5 rounded-full bg-red-500"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Time period header
const TimePeriodHeader = ({ 
  title, 
  income, 
  expense, 
  period 
}: { 
  title: string, 
  income: number, 
  expense: number, 
  period: string 
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground mb-4">Financial summary for {period}</div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30">
          <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4 px-3 sm:px-6">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium text-green-800 dark:text-green-300">Income</div>
              <TrendingUp className="text-green-500 h-4 w-4" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">
              {income.toLocaleString('en-US', {
                style: 'currency',
                currency: 'THB'
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
          <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4 px-3 sm:px-6">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium text-red-800 dark:text-red-300">Expenses</div>
              <TrendingDown className="text-red-500 h-4 w-4" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400">
              {expense.toLocaleString('en-US', {
                style: 'currency',
                currency: 'THB'
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className={(income - expense) >= 0 ? 
          "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30" : 
          "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30"
        }>
          <CardContent className="pt-4 sm:pt-6 pb-3 sm:pb-4 px-3 sm:px-6">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Balance</div>
              {(income - expense) >= 0 ? 
                <PiggyBank className="text-blue-500 h-4 w-4" /> : 
                <CreditCard className="text-orange-500 h-4 w-4" />
              }
            </div>
            <div className={`text-lg sm:text-2xl font-bold ${(income - expense) >= 0 ? 
              "text-blue-700 dark:text-blue-400" : 
              "text-orange-700 dark:text-orange-400"}`
            }>
              {(income - expense).toLocaleString('en-US', {
                style: 'currency',
                currency: 'THB'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Custom hook for caching data
function useCachedData<T>(key: string, fetcher: () => Promise<T>, dependencies: any[] = [], cacheTime = 5 * 60 * 1000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<{
    data: T | null;
    timestamp: number;
  }>({
    data: null,
    timestamp: 0
  });
  
  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (!force && cacheRef.current.data && now - cacheRef.current.timestamp < cacheTime) {
      setData(cacheRef.current.data);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
      
      // Update cache
      cacheRef.current = {
        data: result,
        timestamp: now
      };
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, cacheTime]);
  
  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]);
  
  return { data, isLoading, error, refetch: () => fetchData(true) };
}

// Data loader component
const FinanceDataLoader = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  
  useEffect(() => {
    // Mark as loaded after first render
    setIsInitialLoaded(true);
  }, []);
  
  if (!isInitialLoaded) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-xl font-semibold mb-2">Please log in</h2>
        <p className="text-muted-foreground">You need to be logged in to use the Finance Tracker.</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

// Format currency globally
const formatCurrency = (amount: number, currency = 'THB') => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Finance content component
const FinanceContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('cash');
  const [newAccountCurrency, setNewAccountCurrency] = useState('THB');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isDeleteTransactionOpen, setIsDeleteTransactionOpen] = useState(false);
  const isMobile = useIsMobile();

  // For monthly view
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Cache reference to avoid unnecessary refetches
  const dataCache = useRef<{
    accounts: FinancialAccount[];
    transactions: Transaction[];
    budgets: Budget[];
    categories: TransactionCategory[];
    lastFetchTime: number;
  }>({
    accounts: [],
    transactions: [],
    budgets: [],
    categories: [],
    lastFetchTime: 0
  });
  
  // Flag to track if initial data fetch is complete
  const hasInitialData = useRef(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    // Don't refetch if we're already refreshing
    if (isRefresh && isRefreshing) return;
    
    // Skip if user is not available
    if (!user) return;

    // Check if we have recently cached data (within last 2 minutes)
    const now = Date.now();
    const cacheAge = now - dataCache.current.lastFetchTime;
    const hasCachedData = dataCache.current.accounts.length > 0 && 
                          dataCache.current.transactions.length > 0;
    
    // Use cache if available and not a forced refresh
    if (hasCachedData && cacheAge < 2 * 60 * 1000 && !isRefresh) {
      setAccounts(dataCache.current.accounts);
      setTransactions(dataCache.current.transactions);
      setBudgets(dataCache.current.budgets);
      setCategories(dataCache.current.categories);
      
      if (!selectedAccountId && dataCache.current.accounts.length > 0) {
        setSelectedAccountId(dataCache.current.accounts[0].id);
      }
      
      hasInitialData.current = true;
        return;
      }

    if (isRefresh) {
      setIsRefreshing(true);
    } else if (!hasInitialData.current) {
      setIsLoading(true);
    }
    
    try {
      console.log(`[${new Date().toISOString()}] Fetching finance data for user: ${user.id}`);
      
      // Fetch data in parallel using Promise.all
      const [accountsResult, transactionsResult, budgetsResult, categoriesResult] = await Promise.all([
      // Accounts
        supabase
        .from('financial_accounts')
        .select('*')
        .eq('user_id', user.id)
          .order('created_at'),
      
      // Transactions
        supabase
        .from('transactions')
        .select('*, transaction_categories(name, type, icon, color)')
        .eq('user_id', user.id)
          .order('date', { ascending: false }),
      
      // Budgets
        supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
          .order('created_at'),
      
      // Categories
        supabase
        .from('transaction_categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_system.eq.true`)
          .order('name')
      ]);
      
      // Check for errors
      if (accountsResult.error) throw accountsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      if (budgetsResult.error) throw budgetsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      
      const accountsData = accountsResult.data || [];
      const transactionsData = transactionsResult.data || [];
      const budgetsData = budgetsResult.data || [];
      const categoriesData = categoriesResult.data || [];
      
      // Update state
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setCategories(categoriesData);
      
      // Update cache
      dataCache.current = {
        accounts: accountsData,
        transactions: transactionsData,
        budgets: budgetsData,
        categories: categoriesData,
        lastFetchTime: now
      };
      
      // Set default account if needed
      if (accountsData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accountsData[0].id);
      }
      
      hasInitialData.current = true;
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load finance data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, selectedAccountId, isRefreshing, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll, user]);
  
  // Add a useEffect for real-time updates with Supabase subscription
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time subscription for transactions
    const transactionSubscription = supabase
      .channel('finance-transactions')
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Transaction change detected:', payload);
        
        // Immediately update local data based on the change type
        if (payload.eventType === 'INSERT') {
          // Fetch the new transaction with its category
          supabase
            .from('transactions')
            .select('*, transaction_categories(name, type, icon, color)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (!error && data) {
                setTransactions(prev => [data, ...prev]);
              }
            });
        } else if (payload.eventType === 'UPDATE') {
          // Update the existing transaction in the state
          setTransactions(prev => prev.map(t => 
            t.id === payload.new.id ? { ...t, ...payload.new } : t
          ));
        } else if (payload.eventType === 'DELETE') {
          // Remove the deleted transaction from state
          setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
        }
        
        // Also force refresh data to ensure complete sync
        dataCache.current.lastFetchTime = 0;
        fetchAll(true);
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      transactionSubscription.unsubscribe();
    };
  }, [user, fetchAll]);

  // Also add similar subscription for accounts
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time subscription for accounts
    const accountSubscription = supabase
      .channel('finance-accounts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'financial_accounts',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Account change detected:', payload);
        // Force refresh data when an account changes
        dataCache.current.lastFetchTime = 0;
        fetchAll(true);
      })
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      accountSubscription.unsubscribe();
    };
  }, [user, fetchAll]);

  // Handle account creation
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .insert({
          name: newAccountName.trim(),
          type: newAccountType,
          currency: newAccountCurrency,
          user_id: user.id,
          balance: 0,
        });
      if (error) throw error;
      setNewAccountName('');
      setNewAccountType('cash');
      setNewAccountCurrency('THB');
      setIsAddAccountOpen(false);
      fetchAll(true); // Force refresh after adding account
      toast({ title: 'Account added' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to add account', 
        variant: 'destructive' 
      });
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (id: string) => {
    if (!id || !user) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh transactions
      fetchAll(true);
      
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully'
      });
      
      // Close dialog if open
      setIsDeleteTransactionOpen(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive'
      });
    }
  };

  // Open edit transaction dialog
  const openEditTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  // Open delete transaction dialog
  const openDeleteTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setIsDeleteTransactionOpen(true);
  };

  // Close transaction dialog
  const closeTransactionDialog = () => {
    setIsEditTransactionOpen(false);
    setCurrentTransaction(null);
  };

  // Filter transactions by time period
  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    
    const accountTransactions = transactions.filter(t => t.account_id === selectedAccountId);
    
    // Filter by selected time period
    switch (timePeriod) {
      case 'weekly': {
        const { start, end } = getCurrentWeekDates();
        return accountTransactions.filter(t => {
          const txDate = new Date(t.date);
          return isWithinInterval(txDate, { start, end });
        });
      }
      case 'monthly': {
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        return accountTransactions.filter(t => {
          const txDate = new Date(t.date);
          return isWithinInterval(txDate, { start, end });
        });
      }
      case 'yearly': {
        const { start, end } = getCurrentYearDates();
        return accountTransactions.filter(t => {
          const txDate = new Date(t.date);
          return isWithinInterval(txDate, { start, end });
        });
      }
      case 'overall':
      default:
        // Return all transactions for the selected account
        return accountTransactions;
    }
  }, [transactions, selectedAccountId, timePeriod, selectedMonth]);

  // Stats
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = selectedAccount ? selectedAccount.balance : (totalIncome - totalExpense);

  // Get time period description text
  const getPeriodDescription = () => {
    switch (timePeriod) {
      case 'weekly':
        return `${format(getCurrentWeekDates().start, 'MMM d')} - ${format(getCurrentWeekDates().end, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(selectedMonth, 'MMMM yyyy');
      case 'yearly':
        return format(getCurrentYearDates().start, 'yyyy');
      default:
        return 'all time';
    }
  };

  // Prepare graph data based on time period
  const getGraphData = () => {
    if (filteredTransactions.length === 0) return [];
    
    switch (timePeriod) {
      case 'weekly': {
        // Group by day of week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = days.map(day => ({ name: day, income: 0, expense: 0 }));
        
        filteredTransactions.forEach(t => {
          const date = new Date(t.date);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday, 6 = Sunday
          
          if (t.type === 'income') {
            data[adjustedDay].income += Math.abs(t.amount);
          } else {
            data[adjustedDay].expense += Math.abs(t.amount);
          }
        });
        
        return data;
      }
      
      case 'monthly': {
        // Group by day of month
        const daysInMonth = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          0
        ).getDate();
        
        const data = Array.from({ length: daysInMonth }, (_, i) => {
          return { name: (i + 1).toString(), income: 0, expense: 0 };
        });
        
        filteredTransactions.forEach(t => {
          const date = new Date(t.date);
          if (date.getMonth() === selectedMonth.getMonth() && 
              date.getFullYear() === selectedMonth.getFullYear()) {
            const day = date.getDate() - 1; // 0-indexed for array
            if (t.type === 'income') {
              data[day].income += Math.abs(t.amount);
            } else {
              data[day].expense += Math.abs(t.amount);
            }
          }
        });
        
        return data;
      }
      
      case 'yearly': {
        // Group by month
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        const data = months.map(month => ({ name: month, income: 0, expense: 0 }));
        
        filteredTransactions.forEach(t => {
          const date = new Date(t.date);
          if (date.getFullYear() === new Date().getFullYear()) {
            const month = date.getMonth(); // 0-indexed
            if (t.type === 'income') {
              data[month].income += Math.abs(t.amount);
            } else {
              data[month].expense += Math.abs(t.amount);
            }
          }
        });
        
        return data;
      }
      
      default: {
        // Group by month for last 12 months
        const data = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
          data.push({
            name: format(date, 'MMM yy'),
            income: 0,
            expense: 0,
            date: date
          });
        }
        
        filteredTransactions.forEach(t => {
          const txDate = new Date(t.date);
          const monthYear = format(txDate, 'MMM yy');
          
          const dataItem = data.find(d => d.name === monthYear);
          if (dataItem) {
            if (t.type === 'income') {
              dataItem.income += Math.abs(t.amount);
            } else {
              dataItem.expense += Math.abs(t.amount);
            }
          }
        });
        
        return data;
      }
    }
  };

  // Pie chart data
  const expenseByCategory = filteredTransactions
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
  filteredTransactions.forEach(t => {
    const month = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyDataMap[month]) monthlyDataMap[month] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyDataMap[month].income += Math.abs(t.amount);
    if (t.type === 'expense') monthlyDataMap[month].expense += Math.abs(t.amount);
  });
  const monthlyData = Object.entries(monthlyDataMap).map(([name, v]) => ({ name, ...v }));

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap: Record<string, { amount: number, color: string }> = {};
    
    // Get only expense transactions
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
      const categoryName = transaction.transaction_categories?.name || 'Other';
      const categoryColor = transaction.transaction_categories?.color || COLORS[0];
      
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = { amount: 0, color: categoryColor };
      }
      
      categoryMap[categoryName].amount += Math.abs(transaction.amount);
    });
    
    // Convert to array and sort by amount (descending)
    return Object.entries(categoryMap)
      .map(([name, { amount, color }]) => ({ name, value: amount, color }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // NEW: Add income category breakdown
  const incomeCategoryBreakdown = useMemo(() => {
    const categoryMap: Record<string, { amount: number, color: string }> = {};
    
    // Get only income transactions
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
    
    incomeTransactions.forEach(transaction => {
      const categoryName = transaction.transaction_categories?.name || 'Other Income';
      const categoryColor = transaction.transaction_categories?.color || COLORS[2];
      
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = { amount: 0, color: categoryColor };
      }
      
      categoryMap[categoryName].amount += Math.abs(transaction.amount);
    });
    
    // Convert to array and sort by amount (descending)
    return Object.entries(categoryMap)
      .map(([name, { amount, color }]) => ({ name, value: amount, color }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // NEW: Add state for category display type
  const [categoryDisplayType, setCategoryDisplayType] = useState<'expense' | 'income'>('expense');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: selectedAccount?.currency || 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setSelectedMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setSelectedMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };

  // Set month to current month
  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // Prepare chart data
  const chartData = getGraphData();

  // Show loading skeleton only on initial load
  if (isLoading && !hasInitialData.current) {
    return (
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-full max-w-[180px]" />
              </CardContent>
            </Card>
          ))}
            </div>
      </div>
    );
  }

  return (
    <>
      {/* Account Selection Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="account-select">Account:</Label>
              <Select value={selectedAccountId || ''} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="min-w-[150px] w-full sm:w-auto" id="account-select">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          
          <div className="flex gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <Button size="sm" variant="outline" onClick={() => setIsAddAccountOpen(true)} className="flex-1 sm:flex-auto">
                + New Account
              </Button>
            
            <Button 
              onClick={() => fetchAll(true)} 
              variant="outline" 
              size="sm"
              disabled={isRefreshing}
              className="flex-1 sm:flex-auto"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <span>↺</span>
                  <span>Refresh</span>
                </span>
              )}
            </Button>
          </div>
            </div>
          </div>

              {selectedAccountId && (
        <>
          {/* Time Period Tabs */}
          <Tabs 
            defaultValue="monthly" 
            value={timePeriod}
            onValueChange={(value) => setTimePeriod(value as TimePeriod)}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto gap-1">
                <TabsTrigger value="overall" className="flex items-center justify-center gap-1.5 px-2">
                  <BarChart2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overall</span>
                </TabsTrigger>
                <TabsTrigger value="yearly" className="flex items-center justify-center gap-1.5 px-2">
                  <LineChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Yearly</span>
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center justify-center gap-1.5 px-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Monthly</span>
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center justify-center gap-1.5 px-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Weekly</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Month navigation for Monthly view */}
              {timePeriod === 'monthly' && (
                <div className="flex items-center gap-2 justify-center sm:justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={goToCurrentMonth}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToNextMonth}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Period Summary */}
            <TimePeriodHeader 
              title={`Financial Summary`}
              income={totalIncome}
              expense={totalExpense} 
              period={getPeriodDescription()}
            />
            
            {/* Tab Contents */}
            <TabsContent value="monthly" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-1 order-2 lg:order-1">
                  <TransactionForm 
                    accountId={selectedAccountId} 
                    onSuccess={fetchAll} 
                    existingTransaction={isEditTransactionOpen ? currentTransaction : null}
                    onDelete={handleDeleteTransaction}
                  />
                  
                  <Card className="mt-4 sm:mt-6">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>Top Categories</CardTitle>
                        <div className="flex rounded-md overflow-hidden border">
                          <button 
                            className={`px-2 py-1 text-xs font-medium ${categoryDisplayType === 'expense' 
                              ? 'bg-red-500 text-white' 
                              : 'bg-background hover:bg-muted'}`}
                            onClick={() => setCategoryDisplayType('expense')}
                          >
                            Expense
                          </button>
                          <button 
                            className={`px-2 py-1 text-xs font-medium ${categoryDisplayType === 'income' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-background hover:bg-muted'}`}
                            onClick={() => setCategoryDisplayType('income')}
                          >
                            Income
                          </button>
                        </div>
                      </div>
                      <CardDescription>For {format(selectedMonth, 'MMMM yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(categoryDisplayType === 'expense' ? categoryBreakdown : incomeCategoryBreakdown).length > 0 ? (
                        <div className="space-y-3">
                          {(categoryDisplayType === 'expense' ? categoryBreakdown : incomeCategoryBreakdown).slice(0, 6).map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                                ></div>
                                <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{category.name}</span>
                              </div>
                              <div className="text-xs sm:text-sm font-medium">
                                {formatCurrency(category.value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          No {categoryDisplayType} data available
                        </div>
                      )}
                  </CardContent>
                </Card>
                </div>
                
                <div className="lg:col-span-2 order-1 lg:order-2">
                <Card>
                    <CardHeader>
                      <CardTitle>Calendar View</CardTitle>
                      <CardDescription>Transactions for {format(selectedMonth, 'MMMM yyyy')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FinanceCalendar 
                        transactions={filteredTransactions} 
                        selectedMonth={selectedMonth} 
                      />
                  </CardContent>
                </Card>
                  
                  <Card className="mt-4 sm:mt-6">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Latest activity for {format(selectedMonth, 'MMMM yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {filteredTransactions.slice(0, 8).map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0 group relative">
                            <div className="flex-grow pr-10">
                              <div className="font-medium capitalize flex items-center gap-1.5 text-sm">
                            {transaction.transaction_categories?.icon && (
                              <span style={{ color: transaction.transaction_categories.color || undefined }}>
                                {transaction.transaction_categories.icon}
                              </span>
                            )}
                            {transaction.transaction_categories?.name || 'Other'}
                          </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </div>
                              {transaction.note && (
                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px] sm:max-w-none">
                                  {transaction.note}
                                </div>
                              )}
                            </div>
                            <div className={`font-medium text-sm ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                            </div>
                            
                            {/* Action menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteTransaction(transaction)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                      </div>
                    ))}
                        {filteredTransactions.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No transactions found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </TabsContent>
            
            <TabsContent value="yearly" className="mt-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Yearly Overview</CardTitle>
                    <CardDescription>Monthly breakdown for {format(getCurrentYearDates().start, 'yyyy')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => 
                              value.toLocaleString('en-US', {
                                notation: 'compact',
                                compactDisplay: 'short',
                              })
                            } />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value as number), '']}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '0.375rem',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                                border: '1px solid rgba(0, 0, 0, 0.05)'
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="income" 
                              name="Income" 
                              fill="#10b981" 
                              radius={[4, 4, 0, 0]}
                              animationDuration={1000} 
                            />
                            <Bar 
                              dataKey="expense" 
                              name="Expenses" 
                              fill="#ef4444" 
                              radius={[4, 4, 0, 0]}
                              animationDuration={1000} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No data available for this year
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                      <CardTitle>Income Trend</CardTitle>
                      <CardDescription>Monthly income trend for the year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                        {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                              <YAxis tickFormatter={(value) => 
                                value.toLocaleString('en-US', {
                                  notation: 'compact',
                                  compactDisplay: 'short',
                                })
                              } />
                              <Tooltip 
                                formatter={(value) => [formatCurrency(value as number), '']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="income" 
                                name="Income"
                                stroke="#10b981" 
                                fill="#10b981" 
                                fillOpacity={0.2}
                              />
                            </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                            No income data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
                  
            <Card>
              <CardHeader>
                      <CardTitle>Expense Trend</CardTitle>
                      <CardDescription>Monthly expense trend for the year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                        {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis tickFormatter={(value) => 
                                value.toLocaleString('en-US', {
                                  notation: 'compact',
                                  compactDisplay: 'short',
                                })
                              } />
                              <Tooltip 
                                formatter={(value) => [formatCurrency(value as number), '']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="expense" 
                                name="Expenses"
                                stroke="#ef4444" 
                                fill="#ef4444" 
                                fillOpacity={0.2}
                              />
                            </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No expense data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-4">
              <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                    <CardTitle>Weekly Overview</CardTitle>
                    <CardDescription>Daily breakdown for the current week</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="h-72">
                      {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => 
                              value.toLocaleString('en-US', {
                                notation: 'compact',
                                compactDisplay: 'short',
                              })
                            } />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value as number), '']}
                            />
                            <Legend />
                            <Bar 
                              dataKey="income" 
                              name="Income" 
                              fill="#10b981" 
                              radius={[4, 4, 0, 0]} 
                            />
                            <Bar 
                              dataKey="expense" 
                              name="Expenses" 
                              fill="#ef4444" 
                              radius={[4, 4, 0, 0]} 
                            />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                          No data available for this week
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
                
            <Card>
              <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest activity this week</CardDescription>
              </CardHeader>
              <CardContent>
                    <div className="space-y-4">
                      {filteredTransactions.slice(0, 8).map((transaction) => (
                        <div key={transaction.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <div className="font-medium capitalize flex items-center gap-1.5">
                              {transaction.transaction_categories?.icon && (
                                <span style={{ color: transaction.transaction_categories.color || undefined }}>
                                  {transaction.transaction_categories.icon}
                                </span>
                              )}
                              {transaction.transaction_categories?.name || 'Other'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString('th-TH', { 
                                weekday: 'short',
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                            {transaction.note && (
                              <div className="text-xs text-muted-foreground mt-1">{transaction.note}</div>
                            )}
                          </div>
                          <div className={`font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
                          </div>
                        </div>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No transactions found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
            </TabsContent>
          </Tabs>
        </>
      )}

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
                placeholder="THB"
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
          
          {/* Edit Transaction Dialog */}
          <Dialog 
            open={isEditTransactionOpen} 
            onOpenChange={(open) => {
              if (!open) closeTransactionDialog();
              else setIsEditTransactionOpen(open);
            }}
          >
            <DialogContent className="sm:max-w-[600px] p-0">
              {currentTransaction && (
                <TransactionForm 
                  accountId={selectedAccountId || ''} 
                  onSuccess={() => {
                    // Force immediate refresh by setting cache timestamp to 0
                    dataCache.current.lastFetchTime = 0;
                    fetchAll(true);
                    closeTransactionDialog();
                  }}
                  existingTransaction={currentTransaction}
                  onDelete={handleDeleteTransaction}
                />
              )}
            </DialogContent>
          </Dialog>
          
          {/* Delete Transaction Dialog */}
          <Dialog open={isDeleteTransactionOpen} onOpenChange={setIsDeleteTransactionOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Delete Transaction</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              {currentTransaction && (
                <div className="p-4 border rounded-md bg-muted/50 my-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatCurrency(Math.abs(currentTransaction.amount))}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(currentTransaction.date), "PPP")}
                      </p>
                      <p className="text-sm mt-1">
                        {currentTransaction.transaction_categories?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <Badge 
                      variant={currentTransaction.type === 'expense' ? 'destructive' : 'default'}
                      className={currentTransaction.type === 'income' ? 'bg-green-500 text-white' : ''}
                    >
                      {currentTransaction.type === 'expense' ? 'Expense' : 'Income'}
                    </Badge>
                  </div>
                  {currentTransaction.note && (
                    <p className="mt-2 text-sm border-t pt-2">{currentTransaction.note}</p>
                  )}
                </div>
              )}
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDeleteTransactionOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (currentTransaction) handleDeleteTransaction(currentTransaction.id);
                  }}
                >
                  Delete Transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </>
  );
};

const FinancePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      <main className="flex-1">
        <PageContainer title="Finance Tracker">
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6">
              <div className="h-12 bg-muted animate-pulse rounded-lg"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-32 mb-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24 mb-2" />
                      <Skeleton className="h-4 w-full max-w-[180px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          }>
            <FinanceDataLoader>
              <FinanceContent />
            </FinanceDataLoader>
          </Suspense>
        </PageContainer>
      </main>
    </div>
  );
};

export default FinancePage;
