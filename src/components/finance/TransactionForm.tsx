import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  Hash,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  Receipt,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Coffee,
  Wifi,
  Shirt,
  Activity,
  BookOpen,
  Briefcase,
  Building,
  GraduationCap,
  Smartphone,
  Leaf,
  Gift,
  Inbox,
  Tag,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { Badge } from '@/components/ui/badge';
import { useTransactionCategories } from '@/hooks/use-cached-data';

type TransactionCategory = Database['public']['Tables']['transaction_categories']['Row'];

// Define built-in category icons for the transaction form
interface CategoryIcon {
  name: string;
  type: 'income' | 'expense';
  icon: React.ReactNode;
  color: string;
}

// Pre-defined categories with icons
const categoryIcons: CategoryIcon[] = [
  // Expense categories
  { name: 'Shopping', type: 'expense', icon: <ShoppingBag className="h-4 w-4" />, color: "text-pink-600" },
  { name: 'Food', type: 'expense', icon: <Utensils className="h-4 w-4" />, color: "text-orange-600" },
  { name: 'Coffee', type: 'expense', icon: <Coffee className="h-4 w-4" />, color: "text-amber-700" },
  { name: 'Housing', type: 'expense', icon: <Home className="h-4 w-4" />, color: "text-blue-600" },
  { name: 'Transportation', type: 'expense', icon: <Car className="h-4 w-4" />, color: "text-cyan-600" },
  { name: 'Utilities', type: 'expense', icon: <Wifi className="h-4 w-4" />, color: "text-purple-600" },
  { name: 'Clothing', type: 'expense', icon: <Shirt className="h-4 w-4" />, color: "text-yellow-600" },
  { name: 'Health', type: 'expense', icon: <Activity className="h-4 w-4" />, color: "text-red-600" },
  { name: 'Education', type: 'expense', icon: <BookOpen className="h-4 w-4" />, color: "text-green-600" },
  { name: 'Entertainment', type: 'expense', icon: <CreditCard className="h-4 w-4" />, color: "text-indigo-600" },
  { name: 'Subscriptions', type: 'expense', icon: <Receipt className="h-4 w-4" />, color: "text-violet-600" },
  
  // Income categories
  { name: 'Salary', type: 'income', icon: <Briefcase className="h-4 w-4" />, color: "text-emerald-600" },
  { name: 'Freelance', type: 'income', icon: <Smartphone className="h-4 w-4" />, color: "text-lime-600" },
  { name: 'Investments', type: 'income', icon: <Building className="h-4 w-4" />, color: "text-teal-600" },
  { name: 'Gifts', type: 'income', icon: <Gift className="h-4 w-4" />, color: "text-rose-600" },
  { name: 'Refunds', type: 'income', icon: <Inbox className="h-4 w-4" />, color: "text-fuchsia-600" },
  { name: 'Other Income', type: 'income', icon: <Tag className="h-4 w-4" />, color: "text-gray-600" },
];

// Helper function to get icon for a category
const getCategoryIcon = (categoryName: string, type: 'income' | 'expense'): CategoryIcon => {
  const defaultIcon: CategoryIcon = type === 'income' 
    ? { name: 'Other Income', type: 'income', icon: <Plus className="h-4 w-4" />, color: "text-green-600" }
    : { name: 'Other', type: 'expense', icon: <Tag className="h-4 w-4" />, color: "text-gray-600" };
  
  const matchedIcon = categoryIcons.find(icon => 
    icon.name.toLowerCase() === categoryName.toLowerCase() && icon.type === type
  );
  
  return matchedIcon || defaultIcon;
};

interface TransactionFormProps {
  accountId: string;
  onSuccess: () => void;
}

// Add a constant for the localStorage key
const FORM_STATE_KEY = 'finance_transaction_form_state';

// Add a function to create a category if it doesn't exist
const createCategoryIfNeeded = async (catName: string, type: 'income' | 'expense', userId: string, refetchFn?: () => void): Promise<string | null> => {
  try {
    // First check if the category exists
    const { data: existingCategories, error: searchError } = await supabase
      .from('transaction_categories')
      .select('id')
      .eq('name', catName)
      .eq('type', type)
      .or(`user_id.eq.${userId},is_system.eq.true`);
    
    if (searchError) throw searchError;
    
    // If category exists, return its ID
    if (existingCategories && existingCategories.length > 0) {
      return existingCategories[0].id;
    }
    
    // Otherwise create a new category
    const { data: newCategory, error: insertError } = await supabase
      .from('transaction_categories')
      .insert({
        name: catName,
        type: type,
        user_id: userId,
        is_system: false
      })
      .select('id')
      .single();
    
    if (insertError) throw insertError;
    
    // Refresh categories list if a refetch function is provided
    if (refetchFn) {
      refetchFn();
    }
    
    return newCategory?.id || null;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

const TransactionForm = ({ accountId, onSuccess }: TransactionFormProps) => {
  // Load initial form state from localStorage if available
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem(FORM_STATE_KEY);
      if (savedState) {
        const state = JSON.parse(savedState);
        return {
          currentStep: state.currentStep || 1,
          amount: state.amount || '',
          type: state.type || 'expense',
          categoryId: state.categoryId || '',
          note: state.note || '',
          date: state.date ? new Date(state.date) : new Date(),
          tags: state.tags || '',
        };
      }
    } catch (error) {
      console.error('Error loading saved form state:', error);
    }
    return null;
  };
  
  const savedState = loadSavedState();
  
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 1);
  const [amount, setAmount] = useState(savedState?.amount || '');
  const [type, setType] = useState<'expense' | 'income'>(savedState?.type || 'expense');
  const [categoryId, setCategoryId] = useState(savedState?.categoryId || '');
  const [note, setNote] = useState(savedState?.note || '');
  const [date, setDate] = useState<Date>(savedState?.date || new Date());
  const [tags, setTags] = useState(savedState?.tags || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [showCategorySuccess, setShowCategorySuccess] = useState(false);
  const { user, devMode } = useAuth();
  const { toast } = useToast();
  const [loadingCategory, setLoadingCategory] = useState('');

  // Use our new hook to fetch categories based on the current type
  const { data: categories = [], refetch: refetchCategories } = useTransactionCategories(type);

  // Clear category ID when switching types to avoid invalid selections
  useEffect(() => {
    if (categoryId) {
      const categoryExists = categories.some(cat => cat.id === categoryId && cat.type === type);
      if (!categoryExists) {
        console.log(`[TransactionForm] Clearing categoryId because no match found for type=${type}`);
        setCategoryId('');
      }
    }
    
    // Set default category if none is selected and we have categories available
    if (!categoryId && categories.length > 0) {
      console.log(`[TransactionForm] Setting default category: ${categories[0].name}`);
      setCategoryId(categories[0].id);
    }
  }, [type, categories, categoryId]);

  // Save form state to localStorage whenever key form fields change
  useEffect(() => {
    // Debounce the save operation to prevent excessive writes
    const saveTimeout = setTimeout(() => {
      const formState = {
        currentStep,
        amount,
        type,
        categoryId,
        note,
        date: date.toISOString(),
        tags,
      };
      
      localStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
    }, 300); // wait 300ms before saving
    
    return () => clearTimeout(saveTimeout);
  }, [currentStep, amount, type, categoryId, note, date, tags]);

  const validateAmount = () => {
    if (!amount.trim()) {
      setAmountError('Amount is required');
      return false;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Amount must be a positive number');
      return false;
    }
    
    setAmountError('');
    return true;
  };
  
  const validateCategory = () => {
    if (!categoryId) {
      setCategoryError('Category is required');
      return false;
    }
    
    setCategoryError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!validateAmount() || !validateCategory()) {
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
    setCurrentStep(1);
    setAmount('');
    setType('expense');
    setCategoryId('');
    setNote('');
    setTags('');
    setDate(new Date());
    setAmountError('');
    setCategoryError('');
    
    // Clear saved form state
    localStorage.removeItem(FORM_STATE_KEY);
  };
  
  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateAmount()) return;
    } else if (currentStep === 2) {
      // Check if a category is selected
      if (!categoryId) {
        setCategoryError('Please select a category to continue');
        return;
      }
      setCategoryError('');
    }
    
    setCurrentStep(Math.min(currentStep + 1, 3));
  };
  
  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Amount & Type";
      case 2: return "Category";
      case 3: return "Details";
      default: return "Add Transaction";
    }
  };
  
  // Jump directly to step if clicked
  const goToStep = (step: number) => {
    // Validate current step before allowing jump
    if (currentStep === 1 && step > 1) {
      if (!validateAmount()) return;
    }
    
    setCurrentStep(step);
  };
  
  const getCategoryDisplay = (category: TransactionCategory) => {
    const categoryName = category.name;
    const { icon, color } = getCategoryIcon(categoryName, type);
    
    return (
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span>{categoryName}</span>
      </div>
    );
  };

  return (
    <Card className="shadow-md border-border/60">
      <CardHeader className={cn(
        "pb-3",
        type === 'expense' ? 'bg-gradient-to-b from-red-500/10 to-transparent' : 'bg-gradient-to-b from-green-500/10 to-transparent'
      )}>
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Add Transaction</span>
          <span className={cn(
            "text-sm font-normal px-2 py-1 rounded-full",
            type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          )}>
            {type === 'expense' ? 'Expense' : 'Income'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stepper */}
          <div className="mb-6 mt-2">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step} 
                  className="flex flex-col items-center"
                  onClick={() => goToStep(step)}
                  role="button"
                  tabIndex={0}
                >
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                      currentStep >= step 
                        ? type === 'expense'
                          ? 'bg-red-500 text-white border-red-500 shadow-md' 
                          : 'bg-green-500 text-white border-green-500 shadow-md'
                        : 'bg-secondary text-secondary-foreground border-muted hover:bg-secondary/80'
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="font-medium">{step}</span>
                    )}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground font-medium">
                    {step === 1 ? 'Amount' : step === 2 ? 'Category' : 'Details'}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(currentStep / 3) * 100} className={cn(
              "h-2",
              type === 'expense' ? 'bg-red-100' : 'bg-green-100',
              type === 'expense' ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'
            )} />
          </div>
          
          <div className="space-y-4">
            {/* Step 1: Amount and Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Type selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'} 
                className={cn(
                      "w-full justify-center text-base font-normal h-12",
                  type === 'expense' && "bg-red-500 hover:bg-red-600 text-white"
                )}
                    onClick={() => {
                      setType('expense');
                      // We clear categoryId since categories are type-specific
                      setCategoryId('');
                    }}
                  >
                    <ArrowUpCircle className="h-5 w-5 mr-2" />
                Expense
              </Button>
              <Button 
                type="button"
                variant={type === 'income' ? 'default' : 'outline'} 
                className={cn(
                      "w-full justify-center text-base font-normal h-12",
                  type === 'income' && "bg-green-500 hover:bg-green-600 text-white"
                )}
                    onClick={() => {
                      setType('income');
                      // We clear categoryId since categories are type-specific
                      setCategoryId('');
                    }}
                  >
                    <ArrowDownCircle className="h-5 w-5 mr-2" />
                Income
              </Button>
            </div>

            {/* Amount */}
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="amount" className="text-base font-medium">Amount</Label>
              <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                      className={cn(
                        "pl-10 text-xl h-14 font-medium", 
                        amountError ? "border-red-500 focus-visible:ring-red-500" : ""
                      )}
                  value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (amountError) validateAmount();
                      }}
                      onBlur={validateAmount}
                  required
                />
                  </div>
                  {amountError && (
                    <p className="text-red-500 text-sm mt-1">{amountError}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 2: Category */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category" className="text-base font-medium">Select a category</Label>
                  {categoryId && (
                    <Badge variant="outline" className={cn(
                      "px-2 py-1",
                      type === 'expense' ? "bg-red-100 text-red-800 border-red-200" : 
                      "bg-green-100 text-green-800 border-green-200"
                    )}>
                      Selected: {categories.find(c => c.id === categoryId)?.name}
                    </Badge>
                  )}
                </div>
                
                {categoryError && (
                  <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
                    {categoryError}
                  </div>
                )}
                
                <div className={cn(
                  "bg-secondary/40 rounded-lg p-4 border-2",
                  categoryId ? (type === 'expense' ? "border-red-200" : "border-green-200") : "border-dashed border-muted-foreground/30"
                )}>
                  <p className="text-sm font-medium mb-3">{type === 'expense' ? 'Expense' : 'Income'} categories:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                    {categoryIcons.filter(cat => cat.type === type).map((cat) => {
                      // Case-insensitive matching of category names with better comparison logic
                      const foundCat = categories.find(c => 
                        c.name.toLowerCase() === cat.name.toLowerCase()
                      );
                      
                      // Properly handle selection state
                      const isSelected = foundCat && foundCat.id === categoryId;
                      const isLoading = cat.name === loadingCategory;
                      
                      return (
                        <Button
                          key={cat.name}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "justify-start h-12 py-2 px-3 border-2 transition-all relative overflow-hidden",
                            isSelected && type === 'expense' ? "bg-red-500 text-white border-red-500 shadow-md" : 
                            isSelected && type === 'income' ? "bg-green-500 text-white border-green-500 shadow-md" : 
                            "hover:border-primary hover:bg-secondary"
                          )}
                          disabled={isLoading}
                          onClick={async () => {
                            // Show loading state for this category
                            setLoadingCategory(cat.name);
                            
                            try {
                              // First, check if the category already exists in our fetched categories
                              if (foundCat) {
                                // Found existing category - use it
                                setCategoryId(foundCat.id);
                                setCategoryError('');
                                
                                // Show success animation briefly
                                setShowCategorySuccess(true);
                                setTimeout(() => setShowCategorySuccess(false), 1500);
                              } else if (user) {
                                // Try to create the category if user is logged in
                                const newCatId = await createCategoryIfNeeded(cat.name, type, user.id, refetchCategories);
                                if (newCatId) {
                                  setCategoryId(newCatId);
                                  setCategoryError('');
                                  // No need to explicitly refetch as it's already done in createCategoryIfNeeded
                                  
                                  // Show success animation briefly
                                  setShowCategorySuccess(true);
                                  setTimeout(() => setShowCategorySuccess(false), 1500);
                                } else {
                                  setCategoryError('Failed to create category. Please try again.');
                                }
                              } else {
                                setCategoryError('You need to be logged in to create categories.');
                              }
                            } catch (error) {
                              console.error('Error handling category selection:', error);
                              setCategoryError('Something went wrong. Please try again.');
                            } finally {
                              // Clear loading state
                              setLoadingCategory('');
                            }
                          }}
                        >
                          <div className="flex items-center w-full">
                            <span className={`flex-shrink-0 mr-2 ${isSelected ? "text-white" : cat.color}`}>{cat.icon}</span>
                            <span className="font-medium truncate">{cat.name}</span>
                            {isSelected && (
                              <span className="ml-auto bg-white/20 rounded-full h-4 w-4 flex-shrink-0 flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3" />
                            </span>
                            )}
                          </div>
                          
                          {/* Loading spinner */}
                          {isLoading && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                              <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Success message when category is selected */}
                {showCategorySuccess && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-green-600 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Category selected! Click Next to continue.</span>
                        </div>
                  )}
            </div>
            )}
            
            {/* Step 3: Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
            {/* Date */}
            <div className="grid gap-2">
                  <Label htmlFor="date" className="text-base font-medium">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !date && "text-muted-foreground"
                        )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
          </div>
          
          {/* Note */}
          <div className="grid gap-2">
                  <Label htmlFor="note" className="text-base font-medium">Note (optional)</Label>
            <Textarea
              id="note"
                    placeholder="Add a note about this transaction"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          
          {/* Tags */}
          <div className="grid gap-2">
                  <Label htmlFor="tags" className="text-base font-medium">Tags (optional)</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tags"
                      placeholder="Enter tags separated by commas"
                      className="pl-10"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
                  </div>
                  <p className="text-xs text-muted-foreground">Example: grocery, personal, vacation</p>
            </div>
          </div>
            )}
            
            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              {currentStep > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              ) : (
                <div></div> // Empty div for spacing
              )}
              
              {currentStep < 3 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className={cn(
                    type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
          <Button 
            type="submit" 
            disabled={isSubmitting}
                  className={cn(
                    type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Saving...
                    </>
                  ) : (
                    'Save Transaction'
                  )}
          </Button>
              )}
            </div>
            
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
