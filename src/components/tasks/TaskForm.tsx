import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Minus, 
  ListChecks,
  Target, 
  Timer,
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Briefcase, 
  Home, 
  Code, 
  Heart, 
  DollarSign, 
  GraduationCap, 
  Tag,
  CalendarDays,
  AlarmClock,
  Repeat,
  RotateCcw,
  CheckSquare,
  ArrowUpCircle,
  Trash2,
  Clock,
  Bell,
  X
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

// Define the task type as a union of literal strings
type TaskType = 'task' | 'habit' | 'recurring';

// Define task types with descriptive icons
interface TaskTypeWithIcon {
  value: TaskType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const taskTypesWithIcons: TaskTypeWithIcon[] = [
  { 
    value: 'task', 
    label: 'One-time Task', 
    icon: <CheckSquare className="h-5 w-5" />,
    description: 'A single task with a completion date',
    color: 'bg-blue-500'
  },
  { 
    value: 'habit', 
    label: 'Daily Habit', 
    icon: <RotateCcw className="h-5 w-5" />,
    description: 'Daily activity to build consistency',
    color: 'bg-green-500'
  },
  { 
    value: 'recurring', 
    label: 'Recurring Task', 
    icon: <Repeat className="h-5 w-5" />,
    description: 'Task that repeats at intervals',
    color: 'bg-purple-500'
  }
];

// Define category with icon mapping
interface CategoryWithIcon {
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// Pre-defined categories with enhanced icons and colors
const categoriesWithIcons: CategoryWithIcon[] = [
  { name: 'Work', icon: <Briefcase className="h-4 w-4" />, color: "text-blue-600", bgColor: "bg-blue-100" },
  { name: 'Personal', icon: <Home className="h-4 w-4" />, color: "text-purple-600", bgColor: "bg-purple-100" },
  { name: 'Coding', icon: <Code className="h-4 w-4" />, color: "text-green-600", bgColor: "bg-green-100" },
  { name: 'Health', icon: <Heart className="h-4 w-4" />, color: "text-rose-600", bgColor: "bg-rose-100" },
  { name: 'Finance', icon: <DollarSign className="h-4 w-4" />, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { name: 'Education', icon: <GraduationCap className="h-4 w-4" />, color: "text-amber-600", bgColor: "bg-amber-100" },
  { name: 'Other', icon: <Tag className="h-4 w-4" />, color: "text-gray-600", bgColor: "bg-gray-100" },
];

// Define tracking types with icons
interface TrackingTypeWithIcon {
  value: 'none' | 'boolean' | 'numeric' | 'timer' | 'checklist';
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

// Tracking method options with descriptive data
const trackingTypesWithIcons: TrackingTypeWithIcon[] = [
  {
    value: 'boolean',
    label: 'Yes/No',
    icon: <CheckSquare className="h-5 w-5" />,
    description: 'Track with a boolean value',
    color: 'text-green-500'
  },
  {
    value: 'none',
    label: 'No Tracking',
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: 'Simple checkbox completion',
    color: 'text-gray-500'
  },
  {
    value: 'numeric',
    label: 'Number Goal',
    icon: <Target className="h-5 w-5" />,
    description: 'Track progress with numbers',
    color: 'text-blue-500'
  },
  {
    value: 'timer',
    label: 'Time Tracking',
    icon: <Timer className="h-5 w-5" />,
    description: 'Track time spent on task',
    color: 'text-amber-500'
  },
  {
    value: 'checklist',
    label: 'Checklist',
    icon: <ListChecks className="h-5 w-5" />,
    description: 'Break down into sub-tasks',
    color: 'text-indigo-500'
  }
];

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  category: string | null;
  due_date?: string | null;
  completed: boolean;
  boolean_value?: boolean | null;
  numeric_goal_current?: number | null;
  numeric_goal_target?: number | null;
  numeric_goal_unit?: string | null;
  timer_goal_duration?: number | null;
  timer_goal_elapsed?: number | null;
  streak?: number | null;
  best_streak?: number | null;
  task_checklist_items?: Array<{ id: string; text: string; done: boolean }>;
  reminders?: string[] | null;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Task) => void;
  existingTask?: Task; // Optional existing task for editing
  onDelete?: (id: string) => void; // Optional delete handler
}

const TaskForm = ({ open, onOpenChange, onSubmit, existingTask, onDelete }: TaskFormProps) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('task');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminders, setReminders] = useState<string[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  // Advanced tracking options - Set boolean as default
  const [trackingType, setTrackingType] = useState<'none' | 'boolean' | 'numeric' | 'timer' | 'checklist'>('boolean');
  const [booleanValue, setBooleanValue] = useState<boolean>(false);
  
  // Numeric goal options
  const [numericTarget, setNumericTarget] = useState('1');
  const [numericUnit, setNumericUnit] = useState('');
  
  // Timer goal options
  const [timerDuration, setTimerDuration] = useState('15');
  
  // Checklist options
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: '', done: false }
  ]);
  
  // Editing mode state
  const [isEditing, setIsEditing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Form validation states
  const [titleError, setTitleError] = useState('');
  const [typeSelected, setTypeSelected] = useState(false);
  const [categorySelected, setCategorySelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a confirmation state in the component
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset the form when it's opened/closed
  useEffect(() => {
    if (open) {
      // Check if we're editing an existing task
      if (existingTask) {
        setIsEditing(true);
        setTaskId(existingTask.id);
        setTitle(existingTask.title);
        setDescription(existingTask.description || '');
        setType(existingTask.type);
        setCategory(existingTask.category || '');
        
        // Set due date and time if exists
        if (existingTask.due_date) {
          const dueDateTime = new Date(existingTask.due_date);
          setDueDate(dueDateTime.toISOString().split('T')[0]);
          
          // If there's a time component
          if (dueDateTime.getHours() || dueDateTime.getMinutes()) {
            const hours = dueDateTime.getHours().toString().padStart(2, '0');
            const minutes = dueDateTime.getMinutes().toString().padStart(2, '0');
            setDueTime(`${hours}:${minutes}`);
          } else {
            setDueTime('');
          }
        } else {
          setDueDate('');
          setDueTime('');
        }
        
        // Set tracking type and related values
        if (existingTask.boolean_value !== undefined && existingTask.boolean_value !== null) {
          setTrackingType('boolean');
          setBooleanValue(existingTask.boolean_value);
        } else if (existingTask.numeric_goal_target !== null) {
          setTrackingType('numeric');
          setNumericTarget(existingTask.numeric_goal_target.toString());
          setNumericUnit(existingTask.numeric_goal_unit || '');
        } else if (existingTask.timer_goal_duration !== null) {
          setTrackingType('timer');
          setTimerDuration(existingTask.timer_goal_duration.toString());
        } else if (existingTask.task_checklist_items && existingTask.task_checklist_items.length > 0) {
          setTrackingType('checklist');
          setChecklistItems(existingTask.task_checklist_items);
        } else {
          setTrackingType('none');
        }

        if (existingTask.reminders && existingTask.reminders.length > 0) {
          setReminders(existingTask.reminders);
        }
      } else {
        // Form is opening for a new task - reset everything
        resetForm();
      }
    }
  }, [open, existingTask]);
  
  // Set default tracking type for habits
  useEffect(() => {
    if (type === 'habit' && trackingType === 'none') {
      setTrackingType('numeric');
    }
    
    // If type is selected, mark it
    if (type) {
      setTypeSelected(true);
    }
    
    // For task and recurring types, set trackingType to 'none' by default
    if ((type === 'task' || type === 'recurring') && !typeSelected) {
      setTrackingType('none');
    }
  }, [type, trackingType, typeSelected]);
  
  // Validate the title
  const validateTitle = () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }
    setTitleError('');
    return true;
  };

  // Add submitForm function outside of handleSubmit
  const submitForm = () => {
    const task = {
      id: isEditing && taskId ? taskId : Date.now().toString(),
      title,
      description,
      type,
      category,
      due_date: dueDate ? `${dueDate}${dueTime ? `T${dueTime}:00` : ''}` : null,
      completed: isEditing && existingTask ? existingTask.completed : false,
      reminders: reminders.length > 0 ? reminders : null
    };
    
    // Add tracking features based on the selected type
    if (trackingType === 'boolean') {
      Object.assign(task, {
        boolean_value: booleanValue
      });
    } else if (trackingType === 'numeric') {
      Object.assign(task, {
        numeric_goal_current: isEditing && existingTask?.numeric_goal_current !== null 
          ? existingTask.numeric_goal_current 
          : 0,
        numeric_goal_target: Number(numericTarget),
        numeric_goal_unit: numericUnit || null
      });
    } else if (trackingType === 'timer') {
      Object.assign(task, {
        timer_goal_duration: Number(timerDuration),
        timer_goal_elapsed: isEditing && existingTask?.timer_goal_elapsed !== null 
          ? existingTask.timer_goal_elapsed 
          : 0
      });
    } else if (trackingType === 'checklist') {
      // Filter out empty items
      const validItems = checklistItems.filter(item => item.text.trim() !== '');
      if (validItems.length > 0) {
        Object.assign(task, {
          task_checklist_items: validItems
        });
      }
    }
    
    // Initialize streak for habits or preserve existing ones
    if (type === 'habit') {
      Object.assign(task, {
        streak: isEditing && existingTask?.streak !== null ? existingTask.streak : 0,
        best_streak: isEditing && existingTask?.best_streak !== null ? existingTask.best_streak : 0
      });
    }

    // Submit with a delay to show loading state
    setTimeout(() => {
    onSubmit(task);
    resetForm();
    onOpenChange(false);
      setIsSubmitting(false);
    }, 800);
  };

  // Update the handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!validateTitle()) {
      setCurrentStep(1);
      return;
    }
    
    // Task types should have a valid category
    if (!category) {
      setCategorySelected(false);
      setCurrentStep(2); // Go back to type/category step
      return;
    }
    
    // Habits must have a tracking method
    if (type === 'habit' && trackingType === 'none') {
      setCurrentStep(3); // Go to tracking step
      return;
    }
    
    // Only submit if we're in step 3 and everything is valid
    if (currentStep !== 3) {
      // If not in step 3, move to next step instead of submitting
      nextStep();
      return;
    }
    
    // Show confirmation first if not already shown
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    // Otherwise proceed with submission
    setIsSubmitting(true);
    submitForm();
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTitle('');
    setDescription('');
    setType('task');
    setCategory('');
    setDueDate('');
    setDueTime('');
    setReminders([]);
    setIsAddingReminder(false);
    setReminderTime('');
    setTrackingType('boolean');
    setNumericTarget('1');
    setNumericUnit('');
    setTimerDuration('15');
    setChecklistItems([{ id: '1', text: '', done: false }]);
    setTitleError('');
    setTypeSelected(false);
    setCategorySelected(false);
    setIsEditing(false);
    setTaskId(null);
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
    setShowConfirmation(false);
  };
  
  const handleDelete = () => {
    if (isEditing && taskId && onDelete) {
      if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
        onDelete(taskId);
        onOpenChange(false);
      }
    }
  };
  
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

  const toggleChecklistItem = (id: string, done: boolean) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, done } : item
      )
    );
  };

  const nextStep = () => {
    // Validate each step
    if (currentStep === 1) {
      if (!validateTitle()) return;
    } else if (currentStep === 2) {
      if (!type) {
        setTypeSelected(false);
        return;
      }
      if (!category) {
        setCategorySelected(false);
      return;
      }
    }
    
    // Move to the next step but don't submit automatically
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Task Name & Description";
      case 2:
        return "Task Type & Category";
      case 3:
        return "Tracking Method";
      default:
        return "Create Task";
    }
  };

  // Jump directly to a specific step if the user clicks in the stepper
  const goToStep = (step: number) => {
    // Don't allow skipping steps if required fields are missing
    if (step > 1 && !validateTitle()) return;
    
    // Don't allow going to step 3 if type is not selected
    if (step === 3 && (!type || !category)) {
      setTypeSelected(!type);
      setCategorySelected(!category);
      setCurrentStep(2);
      return;
    }
    
    setCurrentStep(step);
  };

  // Function to handle custom category creation
  const handleAddCustomCategory = () => {
    if (customCategoryName.trim()) {
      // In a real app, you would save this to the database
      // For now, we'll just use it locally
      setCategory(customCategoryName.toLowerCase());
      setCustomCategoryName('');
      setIsAddingCustomCategory(false);
      setCategorySelected(true);
    }
  };

  // Function to add a reminder
  const handleAddReminder = () => {
    if (reminderTime) {
      setReminders([...reminders, reminderTime]);
      setReminderTime('');
      setIsAddingReminder(false);
    }
  };

  // Function to remove a reminder
  const handleRemoveReminder = (index: number) => {
    const newReminders = [...reminders];
    newReminders.splice(index, 1);
    setReminders(newReminders);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle>
            {isEditing 
              ? 'Edit Task' 
              : type === 'habit' 
                ? 'Create New Habit' 
                : type === 'recurring' 
                  ? 'Create Recurring Task' 
                  : 'Create New Task'
            }
          </DialogTitle>
        </DialogHeader>

        {/* Enhanced stepper component with better indicators and step labels */}
        <div className="mb-6 mt-1">
          <div className="flex justify-between mb-3 relative">
            {/* Progress connecting line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-muted-foreground/20"></div>
            <div 
              className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 2) * (100 - 20)}%` }}
            ></div>
            
            {[1, 2, 3].map((step) => (
              <div 
                key={step} 
                className="flex flex-col items-center relative z-10 cursor-pointer px-2"
                onClick={() => goToStep(step)}
                role="button"
                tabIndex={0}
              >
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep > step 
                      ? 'bg-primary text-white border-primary' 
                      : currentStep === step
                        ? 'bg-primary text-white border-primary shadow-md scale-110' 
                        : 'bg-background text-muted-foreground border-muted hover:bg-muted/50'
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-medium">{step}</span>
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors duration-300 text-center ${
                  currentStep === step 
                    ? 'text-primary font-semibold' 
                    : 'text-muted-foreground'
                }`}>
                  {step === 1 
                    ? 'Name' 
                    : step === 2 
                      ? type === 'habit' 
                        ? 'Type & Category' 
                        : 'Details' 
                      : 'Tracking'
                  }
                </span>
                {currentStep === step && (
                  <div className="mt-1 h-1 w-5 bg-primary rounded-full animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
          
          <h3 className={`text-xl font-semibold mt-4 ${
            type === 'habit' 
              ? 'text-cyan-600' 
              : type === 'recurring' 
                ? 'text-purple-600' 
                : 'text-blue-600'
          }`}>
            {getStepTitle()}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[60vh] pb-2">
          {/* Step 1: Task Name & Description */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-3">
                <Label htmlFor="title" className="text-lg font-medium">Task Name</Label>
                <div className="relative">
                <Input 
                  id="title"
                  value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (titleError) validateTitle();
                    }}
                    onBlur={validateTitle}
                    placeholder="What do you want to accomplish?"
                  required
                    className="h-14 text-base rounded-lg px-4 shadow-sm focus:shadow-md transition-shadow"
                    autoFocus
                  />
                  {title && !titleError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {titleError && (
                  <p className="text-red-500 text-sm mt-1">{titleError}</p>
                )}
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="description" className="text-lg font-medium flex items-center justify-between">
                  <span>Description</span>
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any details about this task..."
                  rows={4}
                  className="min-h-[120px] text-base rounded-lg px-4 py-3 resize-none shadow-sm focus:shadow-md transition-shadow"
                />
              </div>
              
              <div className="bg-muted/50 rounded-lg p-5 text-sm text-muted-foreground border border-muted">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-2 mt-0.5 flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="mb-1">Clear task names help you stay organized and focused on your goals.</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Be specific about what you want to accomplish</li>
                      <li>Use action verbs to clarify your goal</li>
                      <li>Add a description for any important details</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Task Type & Category */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Task Type Selection - Redesigned for better visual appeal */}
              <div>
                <Label className="text-base mb-3 block">Task Type</Label>
                <div className="grid grid-cols-1 gap-4">
                  {taskTypesWithIcons.map((taskType) => (
                    <button
                      key={taskType.value}
                      type="button"
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                        type === taskType.value 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/20"
                      }`}
                      onClick={() => {
                        setType(taskType.value);
                        setTypeSelected(true);
                        
                        // Set appropriate tracking type
                        if (taskType.value === 'habit') {
                          setTrackingType('numeric');
                        } else {
                          setTrackingType('none');
                        }
                      }}
                    >
                      <div className={`rounded-full p-3 ${
                        type === taskType.value 
                          ? `text-white ${taskType.color}`
                          : "text-muted-foreground bg-muted"
                      }`}>
                        {taskType.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-medium mb-1">{taskType.label}</div>
                        <div className="text-sm text-muted-foreground">{taskType.description}</div>
                      </div>
                      {type === taskType.value && (
                        <div className="flex items-center self-center">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {!typeSelected && (
                  <p className="text-red-500 text-sm mt-2">Please select a task type</p>
                )}
              </div>
              
              {/* Category Selection - Keep the existing grid layout but improve styling */}
              <div>
                <Label className="text-base mb-3 block flex justify-between">
                  <span>Category</span>
                  <span className="text-xs text-muted-foreground font-normal">(helps organize your tasks)</span>
                </Label>
                
                {isAddingCustomCategory ? (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="flex-1"
                        autoFocus
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddCustomCategory}
                        disabled={!customCategoryName.trim()}
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingCustomCategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {categoriesWithIcons.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all h-[80px] justify-center ${
                          category === cat.name.toLowerCase()
                            ? "border-primary " + cat.bgColor
                            : "border-muted hover:border-muted-foreground/20"
                        }`}
                        onClick={() => {
                          setCategory(cat.name.toLowerCase());
                          setCategorySelected(true);
                        }}
                      >
                        <div className={`rounded-full p-2 ${cat.color}`}>
                          {cat.icon}
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </button>
                    ))}
                    
                    <button
                      type="button"
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-all h-[80px] justify-center"
                      onClick={() => setIsAddingCustomCategory(true)}
                    >
                      <div className="rounded-full p-2 text-muted-foreground">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Create Category</span>
                    </button>
                </div>
                )}
                
                {!categorySelected && (
                  <p className="text-red-500 text-sm mt-2">Please select a category</p>
                )}
              </div>
              
              {/* Due Date and Time (for task and recurring only) */}
              {type !== 'habit' && (
                <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="dueDate" className="text-base flex justify-between">
                      <span>Due Date</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {type === 'recurring' ? '(first occurrence)' : '(optional)'}
                      </span>
                    </Label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  {dueDate && (
                    <div className="grid gap-2">
                      <Label htmlFor="dueTime" className="text-base">Due Time (optional)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="dueTime"
                          type="time"
                          value={dueTime}
                          onChange={(e) => setDueTime(e.target.value)}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  )}

                  {/* Reminders */}
                  <div className="grid gap-2">
                    <Label className="text-base">Reminders (optional)</Label>
                    
                    {reminders.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {reminders.map((reminder, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                              <Bell className="h-4 w-4 text-muted-foreground" />
                              <span>{reminder}</span>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveReminder(index)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAddingReminder ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddReminder}
                          disabled={!reminderTime}
                          size="sm"
                        >
                          Add
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsAddingReminder(false)}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setIsAddingReminder(true)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Reminder</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
              </div>
          )}
          
          {/* Step 3: Tracking Method */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base">
                    {type === 'habit' 
                      ? 'How do you want to evaluate your progress?' 
                      : 'How would you like to track this task?'}
                  </Label>
                  
                  {type === 'habit' && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      Required for habits
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4 mt-3">
                  {trackingTypesWithIcons.map((trackOption) => (
                    // Don't show "none" option for habits
                    (type === 'habit' && trackOption.value === 'none') ? null : (
                      <button
                        key={trackOption.value}
                        type="button"
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                          trackingType === trackOption.value 
                            ? `border-primary shadow-md ${
                                trackOption.value === 'numeric' 
                                  ? 'bg-blue-50/80 dark:bg-blue-950/30' 
                                  : trackOption.value === 'timer' 
                                    ? 'bg-amber-50/80 dark:bg-amber-950/30' 
                                    : trackOption.value === 'checklist' 
                                      ? 'bg-indigo-50/80 dark:bg-indigo-950/30' 
                                      : 'bg-primary/5'
                              }`
                            : "border-muted hover:border-muted-foreground/30 hover:bg-muted/10"
                        }`}
                        onClick={() => setTrackingType(trackOption.value)}
                      >
                        <div className={`rounded-full p-3.5 ${
                          trackingType === trackOption.value 
                            ? trackOption.value === 'numeric' 
                              ? 'text-white bg-blue-500 shadow'
                              : trackOption.value === 'timer' 
                                ? 'text-white bg-amber-500 shadow' 
                                : trackOption.value === 'checklist' 
                                  ? 'text-white bg-indigo-500 shadow' 
                                  : 'text-white bg-gray-500 shadow'
                              : "text-muted-foreground bg-muted"
                        }`}>
                          {trackOption.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-medium mb-1">{trackOption.label}</div>
                          <div className="text-sm text-muted-foreground">{trackOption.description}</div>
                        </div>
                        {trackingType === trackOption.value && (
                          <div className="flex items-center self-center">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </button>
                    )
                  ))}
                </div>
                
                {type === 'habit' && trackingType === 'none' && (
                  <p className="text-red-500 text-sm mt-2">
                    Habits require a tracking method to be effective.
                  </p>
                )}
              </div>
              
              {/* Below the trackingTypesWithIcons.map and before the specific tracking options */}
              
              {trackingType === 'boolean' && (
                <div className="p-5 rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/30 mt-4 shadow-sm">
                  <h4 className="text-base font-medium mb-4 flex items-center gap-2 pb-3 border-b border-green-200/50 dark:border-green-900/30">
                    <CheckSquare className="h-5 w-5 text-green-500" />
                    <span className="text-green-700 dark:text-green-300">Yes/No Settings</span>
                  </h4>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="booleanValue" 
                          checked={booleanValue}
                          onCheckedChange={(checked) => setBooleanValue(checked === true)}
                        />
                        <Label htmlFor="booleanValue" className="text-sm mb-2 font-medium">Current Value</Label>
                      </div>
                      
                      <div className="bg-green-100/80 dark:bg-green-900/30 p-3 rounded-md flex items-start gap-2 text-sm text-green-800 dark:text-green-200 mt-4">
                        <CheckSquare className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                        <div>Simple Yes/No tracking for tasks with binary completion states. Mark as <span className="font-semibold">{booleanValue ? 'Yes' : 'No'}</span> to indicate the current state.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show specific tracking options based on selection */}
              {trackingType === 'numeric' && (
                <div className="p-5 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/30 mt-4 shadow-sm">
                  <h4 className="text-base font-medium mb-4 flex items-center gap-2 pb-3 border-b border-blue-200/50 dark:border-blue-900/30">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span className="text-blue-700 dark:text-blue-300">Numeric Goal Settings</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <Label htmlFor="numericTarget" className="text-sm mb-2 block font-medium">Target Value</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNumericTarget(Math.max(1, parseInt(numericTarget) - 1).toString())}
                          className="h-10 w-10 bg-white dark:bg-gray-800"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                          <Input
                            id="numericTarget"
                            type="number"
                            value={numericTarget}
                            onChange={(e) => setNumericTarget(e.target.value)}
                            min="1"
                            required
                          className="text-center h-10 text-lg font-medium bg-white dark:bg-gray-800"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNumericTarget((parseInt(numericTarget) + 1).toString())}
                          className="h-10 w-10 bg-white dark:bg-gray-800"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                        </div>
                    
                    <div>
                      <Label htmlFor="numericUnit" className="text-sm mb-2 block font-medium">Unit <span className="font-normal">(optional)</span></Label>
                          <Input
                            id="numericUnit"
                            value={numericUnit}
                            onChange={(e) => setNumericUnit(e.target.value)}
                            placeholder="e.g., glasses, pages, miles"
                        className="bg-white dark:bg-gray-800"
                          />
                      <p className="text-xs text-muted-foreground mt-2">Define what you're counting (e.g., steps, pages, minutes)</p>
                      </div>
                    
                    <div className="bg-blue-100/80 dark:bg-blue-900/30 p-3 rounded-md flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                      <Target className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <div>If you reach <span className="font-semibold">{numericTarget} {numericUnit || "units"}</span>, your task will automatically be marked as complete.</div>
                    </div>
                  </div>
                </div>
              )}
              
              {trackingType === 'timer' && (
                <div className="p-5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/30 mt-4 shadow-sm">
                  <h4 className="text-base font-medium mb-4 flex items-center gap-2 pb-3 border-b border-amber-200/50 dark:border-amber-900/30">
                    <Timer className="h-5 w-5 text-amber-500" />
                    <span className="text-amber-700 dark:text-amber-300">Timer Settings</span>
                  </h4>
                  
                  <div className="space-y-5">
                      <div>
                      <Label htmlFor="timerDuration" className="text-sm mb-2 block font-medium">Duration in Minutes</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() => setTimerDuration(Math.max(1, parseInt(timerDuration) - 5).toString())}
                          className="h-10 bg-white dark:bg-gray-800"
                        >
                          -5 min
                        </Button>
                        <Input
                          id="timerDuration"
                          type="number"
                          value={timerDuration}
                          onChange={(e) => setTimerDuration(e.target.value)}
                          min="1"
                          required
                          className="text-center h-10 text-lg font-medium bg-white dark:bg-gray-800"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() => setTimerDuration((parseInt(timerDuration) + 5).toString())}
                          className="h-10 bg-white dark:bg-gray-800"
                        >
                          +5 min
                        </Button>
                      </div>
                      
                      {/* Quick presets */}
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {[15, 25, 30, 45].map(mins => (
                          <Button 
                            key={mins} 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className={`${parseInt(timerDuration) === mins ? 'bg-amber-200 dark:bg-amber-800 border-amber-400' : 'bg-white dark:bg-gray-800'}`}
                            onClick={() => setTimerDuration(mins.toString())}
                          >
                            {mins} min
                          </Button>
                        ))}
                      </div>
                      
                      <div className="bg-amber-100/80 dark:bg-amber-900/30 p-3 rounded-md flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200 mt-4">
                        <Timer className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div>Use the timer to track activities that require focused time. When you reach <span className="font-semibold">{timerDuration} minutes</span>, the task will be completed.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {trackingType === 'checklist' && (
                <div className="p-5 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900/30 mt-4 shadow-sm">
                  <h4 className="text-base font-medium mb-4 flex items-center gap-2 pb-3 border-b border-indigo-200/50 dark:border-indigo-900/30">
                    <ListChecks className="h-5 w-5 text-indigo-500" />
                    <span className="text-indigo-700 dark:text-indigo-300">Checklist Items</span>
                  </h4>
                  
                  <div className="space-y-3">
                        {checklistItems.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Input
                              value={item.text}
                              onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                              placeholder={`Item ${index + 1}`}
                          className="flex-1 bg-white dark:bg-gray-800"
                            />
                            <Button
                              type="button"
                          variant="outline"
                              size="icon"
                              onClick={() => removeChecklistItem(item.id)}
                              disabled={checklistItems.length === 1}
                          className="h-9 w-9 p-0 flex-shrink-0 bg-white dark:bg-gray-800"
                            >
                          <Minus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                    
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addChecklistItem}
                      className="w-full mt-2 border-dashed"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                    
                    <div className="bg-indigo-100/80 dark:bg-indigo-900/30 p-3 rounded-md flex items-start gap-2 text-sm text-indigo-800 dark:text-indigo-200 mt-2">
                      <ListChecks className="h-4 w-4 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                      <div>Break down your task into smaller, manageable steps. When all items are completed, the task will be marked as done.</div>
                      </div>
                </div>
                </div>
              )}
            </div>
          )}
          
          {/* Confirmation message at the end of Step 3 */}
          {currentStep === 3 && trackingType !== 'none' && showConfirmation && (
            <div className="mt-6 p-4 border border-primary/30 bg-primary/5 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary p-2 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-base mb-1">Ready to create your {type}!</h4>
                  <p className="text-sm text-muted-foreground">
                    {type === 'habit' 
                      ? "You're all set to start tracking this new habit. Click 'Create Task' to begin." 
                      : type === 'recurring' 
                        ? "Your recurring task has been configured. Click 'Create Task' to add it to your schedule." 
                        : "Your task is configured and ready to go. Click 'Create Task' to add it to your list."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Footer */}
          <DialogFooter className="pt-6 flex items-center justify-between w-full">
            {currentStep > 1 ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                className="flex items-center gap-1 h-11 px-5 min-w-[100px] transition-all duration-300"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div> {/* Empty div to maintain space for back button */} </div>
            )}
            
            {isEditing && onDelete && (
              <Button 
                type="button" 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-11"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button 
                type="button" 
                onClick={nextStep} 
                className={`h-11 px-5 min-w-[100px] transition-all duration-300 ${
                  type === 'habit' 
                    ? 'bg-cyan-600 hover:bg-cyan-700' 
                    : type === 'recurring' 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-primary hover:bg-primary/90'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>Next Step</span>
                  <ChevronRight className="h-4 w-4 animate-bounceX" />
                </span>
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={(type === 'habit' && trackingType === 'none') || isSubmitting}
                className={`h-11 px-6 min-w-[140px] transition-all duration-300 ${
                  type === 'habit' 
                    ? 'bg-cyan-600 hover:bg-cyan-700' 
                    : type === 'recurring' 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-primary hover:bg-primary/90'
                }`}
                onClick={() => {
                  if (type === 'habit' && trackingType === 'none') {
                    setShowConfirmation(false);
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                    <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? "Update Task" : showConfirmation ? "Confirm & Create" : "Create Task"}</span>
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
