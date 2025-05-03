
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, RefreshCw, ListChecks, Target, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type TaskType = 'task' | 'habit' | 'recurring';

// Enhanced task interface with additional tracking features
interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    type: TaskType;
    category?: string;
    dueDate?: Date;
    // New properties for advanced tracking
    numericGoal?: {
      current: number;
      target: number;
      unit?: string;
    };
    timerGoal?: {
      duration: number; // in minutes
      elapsed?: number;
    };
    checklist?: {
      items: { id: string; text: string; done: boolean }[];
    };
    streak?: number;
    bestStreak?: number;
  };
  onComplete: (id: string, completed: boolean) => void;
  // Additional handlers for the new features
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
    if (task.numericGoal) {
      return <Target className="h-4 w-4 text-purple-500" />;
    } else if (task.timerGoal) {
      return <Timer className="h-4 w-4 text-indigo-500" />;
    } else if (task.checklist) {
      return <ListChecks className="h-4 w-4 text-teal-500" />;
    }
    return null;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Calculate progress percentage for numeric goals and timer goals
  const getProgressPercentage = () => {
    if (task.numericGoal) {
      return (task.numericGoal.current / task.numericGoal.target) * 100;
    } else if (task.timerGoal && task.timerGoal.elapsed) {
      return (task.timerGoal.elapsed / task.timerGoal.duration) * 100;
    }
    return 0;
  };

  // Format the goal text for display
  const getGoalText = () => {
    if (task.numericGoal) {
      return `${task.numericGoal.current}/${task.numericGoal.target} ${task.numericGoal.unit || ''}`;
    } else if (task.timerGoal) {
      const elapsed = task.timerGoal.elapsed || 0;
      return `${elapsed}/${task.timerGoal.duration} min`;
    } else if (task.checklist) {
      const completed = task.checklist.items.filter(i => i.done).length;
      return `${completed}/${task.checklist.items.length}`;
    }
    return null;
  };

  return (
    <Card className={`relative transition-all duration-200 ${task.completed ? 'bg-gray-50 dark:bg-gray-900' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox 
            id={`task-${task.id}`} 
            checked={task.completed}
            onCheckedChange={(checked) => onComplete(task.id, checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                {task.title}
              </span>
              <div className="flex gap-1 items-center text-xs text-muted-foreground">
                {getTypeIcon()}
                <span className="capitalize">{task.type}</span>
              </div>
              
              {/* Display streak if available */}
              {task.streak !== undefined && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Streak: {task.streak}
                </Badge>
              )}
            </div>
            
            {task.description && (
              <p className={`text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-gray-600 dark:text-gray-400'}`}>
                {task.description}
              </p>
            )}
            
            {/* Progress indicators for goals */}
            {(task.numericGoal || task.timerGoal) && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {getGoalIcon()}
                    <span>{getGoalText()}</span>
                  </div>
                </div>
                <Progress value={getProgressPercentage()} className="h-1.5" />
              </div>
            )}
            
            {/* Checklist if available */}
            {task.checklist && task.checklist.items.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="text-xs font-medium flex items-center gap-1">
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Checklist</span>
                </div>
                <div className="space-y-1">
                  {task.checklist.items.slice(0, 2).map(item => (
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
                  {task.checklist.items.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{task.checklist.items.length - 2} more items
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.category && (
                <Badge variant="outline" className="text-xs bg-secondary">
                  {task.category}
                </Badge>
              )}
              {task.dueDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
              {task.bestStreak !== undefined && task.bestStreak > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Best streak: {task.bestStreak}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
