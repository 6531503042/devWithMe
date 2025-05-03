
import React, { useState } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';

// Define the TaskType and Task interface to ensure type safety
type TaskType = 'task' | 'habit' | 'recurring';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  type: TaskType;
  category?: string;
  dueDate?: Date;
  // Enhanced tracking features
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
    items: ChecklistItem[];
  };
  streak?: number;
  bestStreak?: number;
  lastCompleted?: Date;
}

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Finish the initial draft and send for review',
      completed: false,
      type: 'task',
      category: 'work',
      dueDate: new Date(2025, 5, 10)
    },
    {
      id: '2',
      title: 'Morning workout',
      description: '30-minute exercise routine',
      completed: false,
      type: 'habit',
      category: 'health',
      streak: 3,
      bestStreak: 7,
      timerGoal: {
        duration: 30,
        elapsed: 20
      }
    },
    {
      id: '3',
      title: 'Weekly team meeting',
      description: 'Discuss project progress and roadblocks',
      completed: true,
      type: 'recurring',
      category: 'work',
      dueDate: new Date(2025, 5, 5)
    },
    {
      id: '4',
      title: 'Learn React hooks',
      description: 'Study useEffect and useContext',
      completed: false,
      type: 'task',
      category: 'coding'
    },
    {
      id: '5',
      title: 'Drink water',
      description: '8 glasses per day',
      completed: false,
      type: 'habit',
      category: 'health',
      numericGoal: {
        current: 5,
        target: 8,
        unit: 'glasses'
      },
      streak: 2,
      bestStreak: 5
    },
    {
      id: '6',
      title: 'Read book',
      description: 'Continue reading "Clean Code"',
      completed: false,
      type: 'habit',
      category: 'education',
      checklist: {
        items: [
          { id: 'c1', text: 'Chapter 1', done: true },
          { id: 'c2', text: 'Chapter 2', done: true },
          { id: 'c3', text: 'Chapter 3', done: false },
          { id: 'c4', text: 'Chapter 4', done: false }
        ]
      },
      streak: 4,
      bestStreak: 4
    }
  ]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | TaskType>('all');
  
  const handleTaskComplete = (id: string, completed: boolean) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        // Update streak if it's a habit
        let newStreak = task.streak;
        let bestStreak = task.bestStreak;
        
        if (task.type === 'habit') {
          if (completed) {
            // Increment streak when completed
            newStreak = (task.streak || 0) + 1;
            // Update best streak if current streak exceeds it
            bestStreak = Math.max(newStreak, task.bestStreak || 0);
          } else if (task.completed) {
            // Decrement streak if unchecking
            newStreak = Math.max((task.streak || 0) - 1, 0);
          }
        }
        
        return { 
          ...task, 
          completed,
          streak: newStreak,
          bestStreak,
          lastCompleted: completed ? new Date() : task.lastCompleted
        };
      }
      return task;
    }));
  };
  
  const handleAddTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };
  
  const handleNumericUpdate = (id: string, value: number) => {
    setTasks(tasks.map(task => {
      if (task.id === id && task.numericGoal) {
        const updatedGoal = {
          ...task.numericGoal,
          current: value
        };
        
        // Mark as completed if the goal is reached
        const completed = value >= task.numericGoal.target;
        
        return {
          ...task,
          numericGoal: updatedGoal,
          completed: completed
        };
      }
      return task;
    }));
  };
  
  const handleTimerUpdate = (id: string, elapsed: number) => {
    setTasks(tasks.map(task => {
      if (task.id === id && task.timerGoal) {
        const updatedGoal = {
          ...task.timerGoal,
          elapsed
        };
        
        // Mark as completed if the goal is reached
        const completed = elapsed >= task.timerGoal.duration;
        
        return {
          ...task,
          timerGoal: updatedGoal,
          completed: completed
        };
      }
      return task;
    }));
  };
  
  const handleChecklistUpdate = (id: string, itemId: string, done: boolean) => {
    setTasks(tasks.map(task => {
      if (task.id === id && task.checklist) {
        // Update the checklist item
        const updatedItems = task.checklist.items.map(item => {
          if (item.id === itemId) {
            return { ...item, done };
          }
          return item;
        });
        
        // Check if all checklist items are completed
        const allCompleted = updatedItems.every(item => item.done);
        
        return {
          ...task,
          checklist: {
            items: updatedItems
          },
          completed: allCompleted
        };
      }
      return task;
    }));
  };
  
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    return task.type === activeTab;
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Task Manager">
          <div className="mb-6 flex justify-between items-center">
            <Tabs defaultValue="all" value={activeTab} onValueChange={(value: 'all' | TaskType) => setActiveTab(value)} className="w-full max-w-md">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="task">Tasks</TabsTrigger>
                <TabsTrigger value="habit">Habits</TabsTrigger>
                <TabsTrigger value="recurring">Recurring</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button onClick={() => setIsFormOpen(true)} className="ml-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
          
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onComplete={handleTaskComplete}
                  onNumericUpdate={handleNumericUpdate}
                  onTimerUpdate={handleTimerUpdate}
                  onChecklistUpdate={handleChecklistUpdate}
                />
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No tasks found. Create your first task!</p>
              </div>
            )}
          </div>
          
          <TaskForm 
            open={isFormOpen} 
            onOpenChange={setIsFormOpen} 
            onSubmit={handleAddTask} 
          />
        </PageContainer>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default TasksPage;
