import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ListChecks, Target, Timer, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Define the task type as a union of literal strings
type TaskType = 'task' | 'habit' | 'recurring';

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  category: string | null;
  dueDate?: Date;
  completed: boolean;
  numericGoal?: {
    current: number;
    target: number;
    unit: string | null;
  };
  timerGoal?: {
    duration: number;
    elapsed: number;
  };
  checklist?: {
    items: Array<{ id: string; text: string; done: boolean }>;
  };
  streak?: number;
  bestStreak?: number;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Task) => void;
}

const TaskForm = ({ open, onOpenChange, onSubmit }: TaskFormProps) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('task');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Advanced tracking options
  const [trackingType, setTrackingType] = useState<'none' | 'numeric' | 'timer' | 'checklist'>('none');
  
  // Numeric goal options
  const [numericTarget, setNumericTarget] = useState('1');
  const [numericUnit, setNumericUnit] = useState('');
  
  // Timer goal options
  const [timerDuration, setTimerDuration] = useState('15');
  
  // Checklist options
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: '', done: false }
  ]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const task = {
      id: Date.now().toString(),
      title,
      description,
      type,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completed: false
    };
    
    // Add tracking features based on the selected type
    if (trackingType === 'numeric') {
      Object.assign(task, {
        numericGoal: {
          current: 0,
          target: Number(numericTarget),
          unit: numericUnit
        }
      });
    } else if (trackingType === 'timer') {
      Object.assign(task, {
        timerGoal: {
          duration: Number(timerDuration),
          elapsed: 0
        }
      });
    } else if (trackingType === 'checklist') {
      // Filter out empty items
      const validItems = checklistItems.filter(item => item.text.trim() !== '');
      if (validItems.length > 0) {
        Object.assign(task, {
          checklist: {
            items: validItems
          }
        });
      }
    }
    
    // Initialize streak for habits
    if (type === 'habit') {
      Object.assign(task, {
        streak: 0,
        bestStreak: 0
      });
    }

    onSubmit(task);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTitle('');
    setDescription('');
    setType('task');
    setCategory('');
    setDueDate('');
    setTrackingType('none');
    setNumericTarget('1');
    setNumericUnit('');
    setTimerDuration('15');
    setChecklistItems([{ id: '1', text: '', done: false }]);
  };

  const categories = ['Work', 'Personal', 'Coding', 'Health', 'Finance', 'Education'];
  
  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      { id: Date.now().toString(), text: '', done: false }
    ]);
  };
  
  const removeChecklistItem = (id: string) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter(item => item.id !== id));
    }
  };
  
  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, text } : item
      )
    );
  };

  const nextStep = () => {
    // Validation for required fields
    if (currentStep === 1 && !title.trim()) {
      return;
    }
    
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Basic Information";
      case 2:
        return "Task Details";
      case 3:
        return "Tracking Options";
      default:
        return "Create Task";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Task - {getStepTitle()}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="mb-6 mt-2">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div 
                key={step} 
                className="flex flex-col items-center"
              >
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-secondary text-secondary-foreground border-muted'
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>{step}</span>
                  )}
                </div>
                <span className="text-xs mt-1 text-muted-foreground">
                  {step === 1 ? 'Basics' : step === 2 ? 'Details' : 'Tracking'}
                </span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-1.5" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-base">Title</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  required
                  className="h-10"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-base">Description (optional)</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description"
                  rows={3}
                />
              </div>
            </>
          )}
          
          {/* Step 2: Task Details */}
          {currentStep === 2 && (
            <>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-base">Type</Label>
                  <Select value={type} onValueChange={(value: TaskType) => setType(value)}>
                    <SelectTrigger id="type" className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">One-time Task</SelectItem>
                      <SelectItem value="habit">Daily Habit</SelectItem>
                      <SelectItem value="recurring">Recurring Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-base">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat.toLowerCase()}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-base">Due Date (optional)</Label>
                  <Input 
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Step 3: Tracking Options */}
          {currentStep === 3 && (
            <>
              {(type === 'habit' || type === 'task') ? (
                <div className="grid gap-2">
                  <Label className="text-base">How would you like to track this {type}?</Label>
                  <Tabs 
                    value={trackingType} 
                    onValueChange={(v) => setTrackingType(v as 'none' | 'numeric' | 'timer' | 'checklist')}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="none">None</TabsTrigger>
                      <TabsTrigger value="numeric" className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        <span>Goal</span>
                      </TabsTrigger>
                      <TabsTrigger value="timer" className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        <span>Timer</span>
                      </TabsTrigger>
                      <TabsTrigger value="checklist" className="flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span>List</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="numeric" className="mt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <Label htmlFor="numericTarget">Target</Label>
                          <Input
                            id="numericTarget"
                            type="number"
                            value={numericTarget}
                            onChange={(e) => setNumericTarget(e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="numericUnit">Unit (optional)</Label>
                          <Input
                            id="numericUnit"
                            value={numericUnit}
                            onChange={(e) => setNumericUnit(e.target.value)}
                            placeholder="e.g., glasses, pages, miles"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="timer" className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="timerDuration">Duration (minutes)</Label>
                        <Input
                          id="timerDuration"
                          type="number"
                          value={timerDuration}
                          onChange={(e) => setTimerDuration(e.target.value)}
                          min="1"
                          required
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="checklist" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        {checklistItems.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Input
                              value={item.text}
                              onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                              placeholder={`Item ${index + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChecklistItem(item.id)}
                              disabled={checklistItems.length === 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addChecklistItem}
                          className="w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Tracking options are available for tasks and habits only.</p>
                </div>
              )}
            </>
          )}
          
          <DialogFooter className="pt-2 sm:pt-0">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep} className="mr-auto">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit">Create Task</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
