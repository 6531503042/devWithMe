import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface TransactionCategory {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
}

// Mock categories for development mode
const mockCategories: Record<string, TransactionCategory[]> = {
  expense: [
    { id: '1', name: 'Groceries', type: 'expense', icon: '🍎', color: '#ef4444' },
    { id: '2', name: 'Dining Out', type: 'expense', icon: '🍽️', color: '#f97316' },
    { id: '3', name: 'Transport', type: 'expense', icon: '🚗', color: '#3b82f6' },
    { id: '4', name: 'Bills', type: 'expense', icon: '📃', color: '#a855f7' }
  ],
  income: [
    { id: '5', name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
    { id: '6', name: 'Freelance', type: 'income', icon: '💻', color: '#0ea5e9' },
    { id: '7', name: 'Gifts', type: 'income', icon: '🎁', color: '#ec4899' }
  ]
};

interface TransactionFormProps {
  accountId: string;
  onSuccess: () => void;
}

const TransactionForm = ({ accountId, onSuccess }: TransactionFormProps) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, devMode } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    // Use mock categories in development mode
    if (devMode && !user) {
      setCategories(mockCategories[type] || []);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('type', type)
        .order('name');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        // Use mock categories as fallback
        setCategories(mockCategories[type] || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      if (devMode) {
        // Use mock categories if fetch fails in development mode
        setCategories(mockCategories[type] || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !type || !categoryId) return;
    
    setIsSubmitting(true);
    
    // In development mode without a user, simulate adding a transaction
    if (devMode && !user) {
      setTimeout(() => {
        toast({
          title: 'Success (Dev Mode)',
          description: 'Transaction added successfully in development mode',
          variant: 'default'
        });
        
        resetForm();
        onSuccess();
        setIsSubmitting(false);
      }, 500);
      
      return;
    }
    
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          amount: type === 'expense' ? -parseFloat(amount) : parseFloat(amount),
          type,
          category_id: categoryId,
          note: note || null,
          date: new Date().toISOString(),
          user_id: user.id
        });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Transaction added successfully'
      });
      
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      if (devMode) {
        // In dev mode, simulate success even if the database operation fails
        toast({
          title: 'Success (Dev Mode)',
          description: 'Transaction added successfully in development mode',
          variant: 'default'
        });
        
        resetForm();
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add transaction',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategoryId('');
    setNote('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id}
                    className="flex items-center gap-2"
                  >
                    {category.icon && (
                      <span className="text-lg" style={{ color: category.color || undefined }}>
                        {category.icon}
                      </span>
                    )}
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              placeholder="Transaction note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
