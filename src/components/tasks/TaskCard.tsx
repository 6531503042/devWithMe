import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  RefreshCw, 
  ListChecks, 
  Target, 
  Timer, 
  Flame,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Database } from '@/integrations/supabase/types';

type TaskType = Database['public']['Enums']['task_type'];

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
  task_checklist_items?: {
    id: string;
    text: string;
    done: boolean;
  }[];
}

interface TaskCardProps {
  task: Task;
  onComplete: (id: string, completed: boolean) => void;
  onNumericUpdate?: (id: string, value: number) => void;
  onTimerUpdate?: (id: string, elapsed: number) => void;
  onChecklistUpdate?: (id: string, itemId: string, done: boolean) => void;
}

const TaskCard = ({ 
  task, 
  onComplete,
  onNumericUpdate,
  onTimerUpdate,
  onChecklistUpdate
}: TaskCardProps) => {
  const getTypeIcon = () => {
    switch (task.type) {
      case 'habit':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'recurring':
        return <Calendar className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getGoalIcon = () => {
    if (task.numeric_goal_target) {
      return <Target className="h-4 w-4 text-purple-500" />;
    } else if (task.timer_goal_duration) {
      return <Timer className="h-4 w-4 text-indigo-500" />;
    } else if (task.task_checklist_items) {
      return <ListChecks className="h-4 w-4 text-teal-500" />;
    }
    return null;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const date = new Date(dateStr);
    
    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if date is tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Format date to show day of week for upcoming 7 days
    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= 7) {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    }
    
    // Default format for other dates
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  // Calculate progress percentage for numeric goals and timer goals
  const getProgressPercentage = () => {
    if (task.numeric_goal_target && task.numeric_goal_current !== null) {
      return Math.min(100, (task.numeric_goal_current / task.numeric_goal_target) * 100);
    } else if (task.timer_goal_duration && task.timer_goal_elapsed !== null) {
      return Math.min(100, (task.timer_goal_elapsed / task.timer_goal_duration) * 100);
    }
    return 0;
  };

  // Format the goal text for display
  const getGoalText = () => {
    if (task.numeric_goal_target && task.numeric_goal_current !== null) {
      return `${task.numeric_goal_current}/${task.numeric_goal_target} ${task.numeric_goal_unit || ''}`;
    } else if (task.timer_goal_duration && task.timer_goal_elapsed !== null) {
      return `${task.timer_goal_elapsed}/${task.timer_goal_duration} min`;
    } else if (task.task_checklist_items) {
      const completed = task.task_checklist_items.filter(i => i.done).length;
      return `${completed}/${task.task_checklist_items.length}`;
    }
    return null;
  };
  
  // Check if task is overdue
  const isOverdue = () => {
    if (!task.due_date || task.completed) return false;
    const now = new Date();
    return new Date(task.due_date) < now;
  };
  
  // Handle numeric goal updates
  const incrementNumeric = () => {
    if (task.numeric_goal_current !== null && task.numeric_goal_target && onNumericUpdate) {
      onNumericUpdate(task.id, Math.min(task.numeric_goal_current + 1, task.numeric_goal_target));
    }
  };
  
  const decrementNumeric = () => {
    if (task.numeric_goal_current !== null && onNumericUpdate) {
      onNumericUpdate(task.id, Math.max(task.numeric_goal_current - 1, 0));
    }
  };
  
  // Handle timer goal updates
  const incrementTimer = () => {
    if (task.timer_goal_elapsed !== null && task.timer_goal_duration && onTimerUpdate) {
      onTimerUpdate(task.id, Math.min(task.timer_goal_elapsed + 5, task.timer_goal_duration));
    }
  };
  
  const decrementTimer = () => {
    if (task.timer_goal_elapsed !== null && onTimerUpdate) {
      onTimerUpdate(task.id, Math.max(task.timer_goal_elapsed - 5, 0));
    }
  };

  // Get accent color based on task type
  const getAccentColor = () => {
    switch (task.type) {
      case 'habit':
        return 'border-l-blue-500';
      case 'recurring':
        return 'border-l-green-500';
      default:
        return 'border-l-amber-500';
    }
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-green-500';
    if (percentage > 66) return 'bg-blue-500';
    if (percentage > 33) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Format streak display
  const renderStreak = () => {
    if (task.streak === null || task.streak === 0) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-amber-500">
              <Flame className="h-4 w-4" />
              <span className="font-medium">{task.streak}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Current streak: {task.streak} days
              {task.best_streak && task.best_streak > 0 && (
                <span className="block">Best streak: {task.best_streak} days</span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getCardClasses = () => {
    let classes = `relative transition-all duration-200 border-l-4 ${getAccentColor()}`;
    
    if (task.completed) {
      classes += ' bg-muted/20';
    }
    
    if (isOverdue()) {
      classes += ' ring-1 ring-red-500/30';
    }
    
    return classes;
  };

  return (
    <Card className={getCardClasses()}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox 
            id={`task-${task.id}`} 
            checked={task.completed}
            onCheckedChange={(checked) => onComplete(task.id, checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                  {task.title}
                </span>
                {renderStreak()}
              </div>
              <div className="flex gap-1 items-center text-xs">
                {getTypeIcon()}
                <span className="capitalize text-muted-foreground">{task.type}</span>
              </div>
            </div>
            
            {task.description && (
              <p className={`text-sm mb-2 ${task.completed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                {task.description}
              </p>
            )}
            
            {/* Numeric Goal UI */}
            {task.numeric_goal_target !== null && task.numeric_goal_current !== null && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Goal Progress</span>
                  </div>
                  <span>
                    {task.numeric_goal_current}/{task.numeric_goal_target} {task.numeric_goal_unit || ''}
                  </span>
                </div>
                <div className="relative pt-1">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`flex flex-col justify-center overflow-hidden ${getProgressColor()}`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                {onNumericUpdate && !task.completed && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={decrementNumeric}
                      disabled={task.numeric_goal_current <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={incrementNumeric}
                      disabled={task.numeric_goal_current >= task.numeric_goal_target}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Timer Goal UI */}
            {task.timer_goal_duration !== null && task.timer_goal_elapsed !== null && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <Timer className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">Time Progress</span>
                  </div>
                  <span>
                    {task.timer_goal_elapsed}/{task.timer_goal_duration} minutes
                  </span>
                </div>
                <div className="relative pt-1">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`flex flex-col justify-center overflow-hidden ${getProgressColor()}`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                {onTimerUpdate && !task.completed && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={decrementTimer}
                      disabled={task.timer_goal_elapsed <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={incrementTimer}
                      disabled={task.timer_goal_elapsed >= task.timer_goal_duration}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Checklist if available */}
            {task.task_checklist_items && task.task_checklist_items.length > 0 && (
              <div className="mt-2 space-y-1.5 bg-secondary/20 p-2 rounded-md">
                <div className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Checklist ({task.task_checklist_items.filter(i => i.done).length}/{task.task_checklist_items.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {task.task_checklist_items.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <Checkbox 
                        checked={item.done}
                        id={`item-${item.id}`}
                        className="h-3.5 w-3.5"
                        onCheckedChange={(checked) => 
                          onChecklistUpdate && onChecklistUpdate(task.id, item.id, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`item-${item.id}`}
                        className={`text-xs ${item.done ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {task.category && (
                <Badge variant="outline" className="text-xs bg-secondary/50">
                  {task.category}
                </Badge>
              )}
              {task.due_date && (
                <Badge 
                  variant={isOverdue() ? "destructive" : "outline"} 
                  className={`text-xs ${isOverdue() ? '' : 'bg-secondary/50'}`}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(task.due_date)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
