import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, DollarSign, Hash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TransactionCategory = Database['public']['Tables']['transaction_categories']['Row'];

interface TransactionFormProps {
  accountId: string;
  onSuccess: () => void;
}

const TransactionForm = ({ accountId, onSuccess }: TransactionFormProps) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, devMode } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('type', type)
        .or(`user_id.eq.${user?.id},is_system.eq.true`)
        .order('name');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCategories(data);
        // Set default category if available
        if (!categoryId && data.length > 0) {
          setCategoryId(data[0].id);
        }
      } else {
        // If no categories are found, clear the selection
        setCategoryId('');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !type || !categoryId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Process tags if provided
    const tagsArray = tags.trim() ? tags.split(',').map(tag => tag.trim()) : null;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          amount: type === 'expense' ? -parseFloat(amount) : parseFloat(amount),
          type,
          category_id: categoryId,
          note: note.trim() || null,
          date: date.toISOString(),
          tags: tagsArray,
          user_id: user?.id || 'dev-user'
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
      
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategoryId('');
    setNote('');
    setTags('');
    setDate(new Date());
  };

  return (
    <Card className="shadow-md border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'} 
                className={cn(
                  "w-full justify-center text-base font-normal h-10",
                  type === 'expense' && "bg-red-500 hover:bg-red-600 text-white"
                )}
                onClick={() => setType('expense')}
              >
                Expense
              </Button>
              <Button 
                type="button"
                variant={type === 'income' ? 'default' : 'outline'} 
                className={cn(
                  "w-full justify-center text-base font-normal h-10",
                  type === 'income' && "bg-green-500 hover:bg-green-600 text-white"
                )}
                onClick={() => setType('income')}
              >
                Income
              </Button>
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                      >
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-lg" style={{ color: category.color || undefined }}>
                              {category.icon}
                            </span>
                          )}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-category" disabled>No categories available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Note */}
          <div className="grid gap-2">
            <Label htmlFor="note" className="text-sm font-medium">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add details about this transaction"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
          
          {/* Tags */}
          <div className="grid gap-2">
            <Label htmlFor="tags" className="text-sm font-medium">Tags (optional, comma separated)</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tags"
                placeholder="food, groceries, essential"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="pl-10"
              />
            </div>
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
