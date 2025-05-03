
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, RefreshCw } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    type: 'task' | 'habit' | 'recurring';
    category?: string;
    dueDate?: Date;
  };
  onComplete: (id: string, completed: boolean) => void;
}

const TaskCard = ({ task, onComplete }: TaskCardProps) => {
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

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
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
            </div>
            {task.description && (
              <p className={`text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-gray-600 dark:text-gray-400'}`}>
                {task.description}
              </p>
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
