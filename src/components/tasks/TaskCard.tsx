import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Circle, 
  Timer, 
  CalendarDays, 
  ListChecks, 
  TrendingUp, 
  Briefcase, 
  Home, 
  Code, 
  Heart, 
  DollarSign, 
  GraduationCap, 
  Tag,
  X,
  AlertCircle,
  Target,
  Trash2,
  MoreVertical,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Define category with icon mapping for consistency with TaskForm
interface CategoryWithIcon {
  name: string;
  icon: React.ReactNode;
  color: string;
}

// Same pre-defined categories with icons as in TaskForm
const categoriesWithIcons: CategoryWithIcon[] = [
  { name: 'Work', icon: <Briefcase className="h-4 w-4" />, color: "text-blue-600" },
  { name: 'Personal', icon: <Home className="h-4 w-4" />, color: "text-purple-600" },
  { name: 'Coding', icon: <Code className="h-4 w-4" />, color: "text-green-600" },
  { name: 'Health', icon: <Heart className="h-4 w-4" />, color: "text-rose-600" },
  { name: 'Finance', icon: <DollarSign className="h-4 w-4" />, color: "text-emerald-600" },
  { name: 'Education', icon: <GraduationCap className="h-4 w-4" />, color: "text-amber-600" },
  { name: 'Other', icon: <Tag className="h-4 w-4" />, color: "text-gray-600" },
];

// Helper function to get category icon and color
const getCategoryIcon = (categoryName: string) => {
  if (!categoryName) return { icon: <Tag className="h-4 w-4" />, color: "text-gray-600" };
  
  const category = categoriesWithIcons.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  return category || { icon: <Tag className="h-4 w-4" />, color: "text-gray-600" };
};

// Define the TaskType as a union of literal strings (same as TaskForm)
type TaskType = 'task' | 'habit' | 'recurring';

// Reuse the ChecklistItem interface
interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  type: TaskType;
  category: string | null;
  due_date: string | null;
  numeric_goal_current: number | null;
  numeric_goal_target: number | null;
  numeric_goal_unit: string | null;
  timer_goal_duration: number | null;
  timer_goal_elapsed: number | null;
  streak: number | null;
  best_streak: number | null;
  task_checklist_items?: ChecklistItem[];
}

interface TaskCardProps {
  task: Task;
  onComplete: (id: string, completed: boolean) => void;
  onNumericUpdate?: (id: string, value: number) => void;
  onTimerUpdate?: (id: string, elapsed: number) => void;
  onChecklistUpdate?: (id: string, itemId: string, done: boolean) => void;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task, 
  onComplete,
  onNumericUpdate,
  onTimerUpdate,
  onChecklistUpdate,
  onDelete,
  onEdit
}) => {
  const hasTracking = 
    (task.numeric_goal_target !== null) ||
    (task.timer_goal_duration !== null) ||
    (task.task_checklist_items && task.task_checklist_items.length > 0);
    
  const progressValue = 
    task.numeric_goal_target && task.numeric_goal_current
      ? Math.min(100, (task.numeric_goal_current / task.numeric_goal_target) * 100)
      : task.timer_goal_duration && task.timer_goal_elapsed
      ? Math.min(100, (task.timer_goal_elapsed / task.timer_goal_duration) * 100)
      : task.task_checklist_items && task.task_checklist_items.length > 0
      ? Math.round((task.task_checklist_items.filter(item => item.done).length / task.task_checklist_items.length) * 100)
      : 0;
      
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
  
  // Get the category icon and color
  const { icon: categoryIcon, color: categoryColor } = getCategoryIcon(task.category || '');
  
  // Calculate days left if due date exists
  const getDaysLeft = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    
    // Set time to beginning of day for both dates for accurate comparison
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysLeft = getDaysLeft();

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 group hover:shadow-md border-l-4",
      task.completed ? "border-l-green-500 bg-green-50/30" : isOverdue ? "border-l-red-500" : "border-l-primary"
    )}>
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity",
        task.completed && "bg-green-50/50 opacity-30"
      )} />
      
      <CardContent className="p-4 relative">
        {/* Header with checkbox and type/status indicators */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
          <Checkbox 
            checked={task.completed}
            onCheckedChange={(checked) => onComplete(task.id, checked as boolean)}
              className={cn(
                "h-5 w-5 rounded-full transition-all", 
                task.completed ? "bg-green-500 text-white" : "",
                isOverdue && !task.completed ? "border-red-500" : ""
              )}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className={cn(
                "font-medium line-clamp-1 transition-all",
                task.completed ? "text-muted-foreground line-through" : "text-foreground",
                isOverdue && !task.completed ? "text-red-700" : ""
              )}>
                  {task.title}
              </h3>
              
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Category badge with icon */}
                {task.category && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs py-0 h-5 gap-1 font-normal",
                      categoryColor
                    )}
                  >
                    <span className="flex-shrink-0">{categoryIcon}</span>
                    <span className="truncate max-w-[80px]">{task.category}</span>
                  </Badge>
                )}
                
                {/* Type badge */}
                <Badge 
                  variant="secondary" 
                  className="text-xs py-0 h-5 font-normal"
                >
                  {task.type === 'habit' ? (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Habit</span>
                    </span>
                  ) : task.type === 'recurring' ? (
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3" />
                      <span>Recurring</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Task</span>
                </span>
                  )}
                </Badge>
                
                {/* Actions menu */}
                {(onDelete || onEdit) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem 
                          onClick={() => onEdit(task)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onDelete(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            {/* Description */}
            {task.description && (
              <p className={cn(
                "text-sm mb-2",
                task.completed ? "text-muted-foreground/70" : "text-muted-foreground"
              )}>
                {task.description}
              </p>
            )}
            
            {/* Tracking section */}
            {hasTracking && (
              <div className={cn(
                "mt-3 p-2 rounded-md bg-secondary/50",
                task.completed ? "opacity-60" : ""
              )}>
                {/* Numeric goal tracking */}
                {task.numeric_goal_target !== null && (
                  <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        <span>Progress</span>
                      </span>
                      <span className="font-medium">
                        {task.numeric_goal_current || 0} / {task.numeric_goal_target} {task.numeric_goal_unit}
                  </span>
                </div>
                    
                    <Progress value={progressValue} className="h-1.5" />
                    
                    {!task.completed && (
                      <div className="flex items-center gap-1 mt-2">
                    <Button 
                          size="sm"
                      variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => onNumericUpdate?.(task.id, Math.max(0, (task.numeric_goal_current || 0) - 1))}
                    >
                          -
                    </Button>
                        <Input
                          type="number"
                          value={task.numeric_goal_current || 0}
                          onChange={(e) => onNumericUpdate?.(task.id, Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-7 text-center text-xs"
                        />
                    <Button 
                          size="sm"
                      variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => onNumericUpdate?.(task.id, (task.numeric_goal_current || 0) + 1)}
                    >
                          +
                    </Button>
                  </div>
                )}
              </div>
            )}
            
                {/* Timer goal tracking */}
                {task.timer_goal_duration !== null && (
                  <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        <span>Time Spent</span>
                      </span>
                      <span className="font-medium">
                        {task.timer_goal_elapsed || 0} / {task.timer_goal_duration} min
                  </span>
                </div>
                    
                    <Progress value={progressValue} className="h-1.5" />
                    
                    {!task.completed && (
                      <div className="flex items-center gap-1 mt-2">
                    <Button 
                          size="sm"
                      variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => onTimerUpdate?.(task.id, Math.max(0, (task.timer_goal_elapsed || 0) - 5))}
                    >
                          -5m
                    </Button>
                        <Input
                          type="number"
                          value={task.timer_goal_elapsed || 0}
                          onChange={(e) => onTimerUpdate?.(task.id, Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-7 text-center text-xs"
                        />
                    <Button 
                          size="sm"
                      variant="outline" 
                          className="h-7 px-2 text-xs"
                          onClick={() => onTimerUpdate?.(task.id, (task.timer_goal_elapsed || 0) + 5)}
                    >
                          +5m
                    </Button>
                  </div>
                )}
              </div>
            )}
            
                {/* Checklist tracking */}
            {task.task_checklist_items && task.task_checklist_items.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                        <span>Checklist</span>
                      </span>
                      <span className="font-medium">
                        {task.task_checklist_items.filter(item => item.done).length} / {task.task_checklist_items.length}
                      </span>
                </div>
                    
                    <Progress value={progressValue} className="h-1.5 mb-1" />
                    
                    <div className="space-y-1 mt-1.5">
                      {task.task_checklist_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                      <Checkbox 
                            id={`checklist-item-${item.id}`}
                        checked={item.done}
                            onCheckedChange={(checked) => onChecklistUpdate?.(task.id, item.id, checked as boolean)}
                        className="h-3.5 w-3.5"
                            disabled={task.completed}
                      />
                      <label 
                            htmlFor={`checklist-item-${item.id}`}
                            className={cn(
                              "text-xs transition-all cursor-pointer flex-1",
                              item.done ? "line-through text-muted-foreground/70" : "text-foreground"
                            )}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Footer with due date, streak info */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              {/* Due date */}
              {task.due_date && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue ? "text-red-500 font-medium" : ""
                )}>
                  {isOverdue ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CalendarDays className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isOverdue ? (
                      `Overdue${daysLeft ? ` by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}` : ''}`
                    ) : (
                      daysLeft === 0 ? (
                        "Due today"
                      ) : daysLeft === 1 ? (
                        "Due tomorrow"
                      ) : (
                        `Due in ${daysLeft} days`
                      )
                    )}
                  </span>
                </div>
              )}
              
              {/* Streak for habits */}
              {task.type === 'habit' && task.streak !== null && (
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{task.streak} day streak</span>
                  {task.best_streak && task.best_streak > 0 && task.best_streak > task.streak && (
                    <span className="text-muted-foreground/70">(best: {task.best_streak})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
