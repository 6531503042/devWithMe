
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Define the TaskType using the Enum from Supabase
type TaskType = Database['public']['Enums']['task_type'];

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
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | TaskType>('all');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.id);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login';
      }
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user?.id || null);
        if (!session?.user) {
          // Redirect to login if logged out
          window.location.href = '/login';
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch tasks from Supabase
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', currentUser],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          completed,
          type,
          category,
          due_date,
          numeric_goal_current,
          numeric_goal_target,
          numeric_goal_unit,
          timer_goal_duration,
          timer_goal_elapsed,
          streak,
          best_streak,
          task_checklist_items (
            id,
            text,
            done
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          variant: "destructive",
          title: "Failed to fetch tasks",
          description: error.message,
        });
        return [];
      }
      
      // Transform from DB format to our app format
      return (data || []).map(dbTask => {
        const task: Task = {
          id: dbTask.id,
          title: dbTask.title,
          description: dbTask.description || undefined,
          completed: dbTask.completed,
          type: dbTask.type,
          category: dbTask.category || undefined,
          dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
          streak: dbTask.streak || 0,
          bestStreak: dbTask.best_streak || 0
        };
        
        // Add numeric goal if exists
        if (dbTask.numeric_goal_target) {
          task.numericGoal = {
            current: dbTask.numeric_goal_current || 0,
            target: dbTask.numeric_goal_target,
            unit: dbTask.numeric_goal_unit || undefined
          };
        }
        
        // Add timer goal if exists
        if (dbTask.timer_goal_duration) {
          task.timerGoal = {
            duration: dbTask.timer_goal_duration,
            elapsed: dbTask.timer_goal_elapsed || 0
          };
        }
        
        // Add checklist if exists
        if (dbTask.task_checklist_items && dbTask.task_checklist_items.length > 0) {
          task.checklist = {
            items: dbTask.task_checklist_items.map((item: any) => ({
              id: item.id,
              text: item.text,
              done: item.done
            }))
          };
        }
        
        return task;
      });
    },
    enabled: !!currentUser, // Only run the query when we have a user
  });
  
  // Update task completion status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed,
          streak: completed ? tasks.find(t => t.id === id)?.streak ? (tasks.find(t => t.id === id)?.streak || 0) + 1 : 1 : Math.max((tasks.find(t => t.id === id)?.streak || 0) - 1, 0),
          best_streak: completed ? Math.max(tasks.find(t => t.id === id)?.bestStreak || 0, (tasks.find(t => t.id === id)?.streak || 0) + 1) : tasks.find(t => t.id === id)?.bestStreak
        })
        .eq('id', id);
      
      if (error) throw error;
      return { id, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error.message,
      });
    }
  });
  
  // Add new task
  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<Task, 'id'>) => {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      // Prepare data for Supabase schema
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        type: newTask.type,
        category: newTask.category,
        due_date: newTask.dueDate,
        completed: newTask.completed,
        numeric_goal_current: newTask.numericGoal?.current,
        numeric_goal_target: newTask.numericGoal?.target,
        numeric_goal_unit: newTask.numericGoal?.unit,
        timer_goal_duration: newTask.timerGoal?.duration,
        timer_goal_elapsed: newTask.timerGoal?.elapsed,
        streak: newTask.streak || 0,
        best_streak: newTask.bestStreak || 0,
        user_id: currentUser // Add the user_id field here
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select();
      
      if (error) throw error;
      
      // Insert checklist items if any
      if (newTask.checklist && newTask.checklist.items.length > 0 && data && data.length > 0) {
        const checklistItems = newTask.checklist.items.map(item => ({
          task_id: data[0].id,
          text: item.text,
          done: item.done
        }));
        
        const { error: checklistError } = await supabase
          .from('task_checklist_items')
          .insert(checklistItems);
        
        if (checklistError) {
          console.error('Error adding checklist items:', checklistError);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser] });
      setIsFormOpen(false);
      toast({
        title: "Task created",
        description: "Your new task has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create task",
        description: error.message,
      });
    }
  });
  
  // Update numeric goal
  const updateNumericGoalMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string, value: number }) => {
      const task = tasks.find(t => t.id === id);
      const completed = task?.numericGoal ? value >= task.numericGoal.target : false;
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          numeric_goal_current: value,
          completed: completed
        })
        .eq('id', id);
      
      if (error) throw error;
      return { id, value, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update goal",
        description: error.message,
      });
    }
  });
  
  // Update timer goal
  const updateTimerGoalMutation = useMutation({
    mutationFn: async ({ id, elapsed }: { id: string, elapsed: number }) => {
      const task = tasks.find(t => t.id === id);
      const completed = task?.timerGoal ? elapsed >= task.timerGoal.duration : false;
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          timer_goal_elapsed: elapsed,
          completed: completed
        })
        .eq('id', id);
      
      if (error) throw error;
      return { id, elapsed, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update timer",
        description: error.message,
      });
    }
  });
  
  // Update checklist item
  const updateChecklistItemMutation = useMutation({
    mutationFn: async ({ id, itemId, done }: { id: string, itemId: string, done: boolean }) => {
      // Update the checklist item
      const { error: itemError } = await supabase
        .from('task_checklist_items')
        .update({ done })
        .eq('id', itemId);
      
      if (itemError) throw itemError;
      
      // Check if all items are completed to update the task status
      const task = tasks.find(t => t.id === id);
      if (task?.checklist) {
        const updatedItems = task.checklist.items.map(item => 
          item.id === itemId ? { ...item, done } : item
        );
        
        const allCompleted = updatedItems.every(item => item.done);
        
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ completed: allCompleted })
          .eq('id', id);
        
        if (taskError) throw taskError;
      }
      
      return { id, itemId, done };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update checklist",
        description: error.message,
      });
    }
  });
  
  const handleTaskComplete = (id: string, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed });
  };
  
  const handleAddTask = (newTask: Task) => {
    addTaskMutation.mutate(newTask);
  };
  
  const handleNumericUpdate = (id: string, value: number) => {
    updateNumericGoalMutation.mutate({ id, value });
  };
  
  const handleTimerUpdate = (id: string, elapsed: number) => {
    updateTimerGoalMutation.mutate({ id, elapsed });
  };
  
  const handleChecklistUpdate = (id: string, itemId: string, done: boolean) => {
    updateChecklistItemMutation.mutate({ id, itemId, done });
  };
  
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    return task.type === activeTab;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNavbar />
        <main className="flex-1">
          <PageContainer title="Task Manager">
            <div className="py-10 text-center">Loading tasks...</div>
          </PageContainer>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNavbar />
        <main className="flex-1">
          <PageContainer title="Task Manager">
            <div className="py-10 text-center text-red-500">
              Error loading tasks. Please try again later.
            </div>
          </PageContainer>
        </main>
        <AppFooter />
      </div>
    );
  }
  
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
