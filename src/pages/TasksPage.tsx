import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ListChecks, 
  Target, 
  Timer, 
  Calendar, 
  CheckCircle2, 
  RotateCcw, 
  Filter, 
  ChevronUp, 
  TrendingUp, 
  Award 
} from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Database } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

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

const TasksPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | TaskType>('all');
  const [viewOption, setViewOption] = useState<'board' | 'list'>('board');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'dueDate'>('newest');
  const { user } = useAuth();
  
  // Fetch tasks from Supabase for the current authenticated user
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
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
        .eq('user_id', user.id)
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
      
      return data;
    }
  });
  
  // Update task completion status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string, completed: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      
      const task = tasks.find(t => t.id === id);
      const newStreak = completed 
        ? (task?.streak || 0) + 1 
        : Math.max((task?.streak || 0) - 1, 0);
      const newBestStreak = completed 
        ? Math.max(task?.best_streak || 0, newStreak) 
        : task?.best_streak || 0;
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed,
          streak: newStreak,
          best_streak: newBestStreak
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { id, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          type: newTask.type,
          category: newTask.category,
          due_date: newTask.due_date,
          completed: false,
          numeric_goal_current: newTask.numeric_goal_current,
          numeric_goal_target: newTask.numeric_goal_target,
          numeric_goal_unit: newTask.numeric_goal_unit,
          timer_goal_duration: newTask.timer_goal_duration,
          timer_goal_elapsed: newTask.timer_goal_elapsed,
          streak: 0,
          best_streak: 0,
          user_id: user.id
        })
        .select();
      
      if (error) throw error;
      
      // Insert checklist items if any
      if (newTask.task_checklist_items && newTask.task_checklist_items.length > 0 && data && data.length > 0) {
        const checklistItems = newTask.task_checklist_items.map(item => ({
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
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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
      if (!user) throw new Error("User not authenticated");
      
      const task = tasks.find(t => t.id === id);
      const completed = task?.numeric_goal_target ? value >= task.numeric_goal_target : false;
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          numeric_goal_current: value,
          completed
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { id, value, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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
      if (!user) throw new Error("User not authenticated");
      
      const task = tasks.find(t => t.id === id);
      const completed = task?.timer_goal_duration ? elapsed >= task.timer_goal_duration : false;
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          timer_goal_elapsed: elapsed,
          completed
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return { id, elapsed, completed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ taskId, itemId, done }: { taskId: string, itemId: string, done: boolean }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ done })
        .eq('id', itemId)
        .eq('task_id', taskId);
      
      if (error) throw error;
      
      // Check if all checklist items are done, then mark task as completed
      const task = tasks.find(t => t.id === taskId);
      if (task && task.task_checklist_items) {
        const updatedItems = task.task_checklist_items.map(item => 
          item.id === itemId ? { ...item, done } : item
        );
        
        const allDone = updatedItems.every(item => item.done);
        if (allDone !== task.completed) {
          await updateTaskMutation.mutateAsync({ id: taskId, completed: allDone });
        }
      }
      
      return { taskId, itemId, done };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update checklist item",
        description: error.message,
      });
    }
  });
  
  const handleTaskComplete = (id: string, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed });
  };
  
  const handleAddTask = (newTask: Task) => {
    addTaskMutation.mutate(newTask as Omit<Task, 'id'>);
  };
  
  const handleNumericUpdate = (id: string, value: number) => {
    updateNumericGoalMutation.mutate({ id, value });
  };
  
  const handleTimerUpdate = (id: string, elapsed: number) => {
    updateTimerGoalMutation.mutate({ id, elapsed });
  };
  
  const handleChecklistUpdate = (id: string, itemId: string, done: boolean) => {
    updateChecklistMutation.mutate({ taskId: id, itemId, done });
  };

  // Derived stats for dashboard
  const getStats = () => {
    if (!tasks.length) return {
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      habitsWithStreaks: 0,
      maxStreak: 0,
      categories: [],
      tasksWithDeadlines: 0,
      upcomingDeadlines: 0
    };

    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = Math.round((completedTasks / tasks.length) * 100);
    const habitsWithStreaks = tasks.filter(t => t.type === 'habit' && (t.streak || 0) > 0).length;
    const maxStreak = tasks.reduce((max, task) => Math.max(max, task.best_streak || 0), 0);
    
    // Get unique categories
    const categoryMap = tasks.reduce((acc: Record<string, number>, task) => {
      const category = task.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Tasks with deadlines
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasksWithDeadlines = tasks.filter(t => t.due_date !== null).length;
    const upcomingDeadlines = tasks.filter(t => {
      if (!t.due_date || t.completed) return false;
      const dueDate = new Date(t.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    
    return {
      totalTasks: tasks.length,
      completedTasks,
      completionRate,
      habitsWithStreaks,
      maxStreak,
      categories,
      tasksWithDeadlines,
      upcomingDeadlines
    };
  };

  // Filter and sort tasks
  const filteredTasks = () => {
    let filtered = [...tasks];
    
    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => task.type === activeTab);
    }
    
    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(task => 
        filterCategory === 'uncategorized' 
          ? !task.category 
          : task.category === filterCategory
      );
    }
    
    // Apply sorting
    switch (sortOrder) {
      case 'oldest':
        // Assume newer tasks have higher IDs
        filtered = filtered.sort((a, b) => a.id.localeCompare(b.id));
        break;
      case 'dueDate':
        filtered = filtered.sort((a, b) => {
          // Put tasks without due dates at the end
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
        break;
      default: // newest
        filtered = filtered.sort((a, b) => b.id.localeCompare(a.id));
    }
    
    return filtered;
  };

  // Get unique categories for the filter dropdown
  const uniqueCategories = () => {
    const categories = new Set(tasks.map(task => task.category || 'Uncategorized'));
    return Array.from(categories);
  };

  const stats = getStats();
  const taskList = filteredTasks();
  const categories = uniqueCategories();

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Tasks & Habits">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <div className="flex items-baseline">
                    <h3 className="text-2xl font-bold">{stats.completionRate}%</h3>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({stats.completedTasks}/{stats.totalTasks})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Habits</p>
                  <div className="flex items-baseline">
                    <h3 className="text-2xl font-bold">{stats.habitsWithStreaks}</h3>
                    <span className="text-xs text-muted-foreground ml-1">
                      habits with streaks
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Streak</p>
                  <div className="flex items-baseline">
                    <h3 className="text-2xl font-bold">{stats.maxStreak}</h3>
                    <span className="text-xs text-muted-foreground ml-1">
                      days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Deadlines</p>
                  <div className="flex items-baseline">
                    <h3 className="text-2xl font-bold">{stats.upcomingDeadlines}</h3>
                    <span className="text-xs text-muted-foreground ml-1">
                      in next 7 days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filter and Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'all' | TaskType)}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="task">Tasks</TabsTrigger>
                <TabsTrigger value="habit">Habits</TabsTrigger>
                <TabsTrigger value="recurring">Recurring</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Category</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterCategory(null)}>
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map(category => (
                    <DropdownMenuItem 
                      key={category} 
                      onClick={() => setFilterCategory(
                        category === 'Uncategorized' ? 'uncategorized' : category
                      )}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ChevronUp size={16} />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder('newest')}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('dueDate')}>
                    Due Date
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={() => setViewOption(viewOption === 'board' ? 'list' : 'board')}>
                {viewOption === 'board' ? 'List View' : 'Board View'}
              </Button>
              
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus size={16} />
                Add Task
              </Button>
            </div>
          </div>
          
          {/* Filter UI */}
          {(filterCategory || sortOrder !== 'newest') && (
            <div className="flex gap-2 mb-4">
              {filterCategory && (
                <Badge variant="secondary" className="gap-1">
                  Category: {filterCategory === 'uncategorized' ? 'Uncategorized' : filterCategory}
                  <button 
                    className="ml-1" 
                    onClick={() => setFilterCategory(null)}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {sortOrder !== 'newest' && (
                <Badge variant="secondary" className="gap-1">
                  Sorted by: {sortOrder === 'oldest' ? 'Oldest First' : 'Due Date'}
                  <button 
                    className="ml-1" 
                    onClick={() => setSortOrder('newest')}
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && <div className="text-center py-10">Loading tasks...</div>}
          
          {/* Error State */}
          {error && (
            <Card className="mb-6 bg-destructive/10">
              <CardContent className="p-4 text-center text-destructive">
                Failed to load tasks. Please try refreshing the page.
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {!isLoading && !error && taskList.length === 0 && (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {filterCategory || activeTab !== 'all' 
                    ? "Try changing your filters or " 
                    : "Get started by "}
                  creating a new task.
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Task
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Board View */}
          {!isLoading && !error && taskList.length > 0 && viewOption === 'board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskList.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                  onNumericUpdate={handleNumericUpdate}
                  onTimerUpdate={handleTimerUpdate}
                  onChecklistUpdate={handleChecklistUpdate}
                />
              ))}
            </div>
          )}
          
          {/* List View */}
          {!isLoading && !error && taskList.length > 0 && viewOption === 'list' && (
            <div className="space-y-2">
              {taskList.map(task => (
                <div key={task.id} className="border rounded-md hover:bg-secondary/5 transition-colors">
                  <TaskCard
                    task={task}
                    onComplete={handleTaskComplete}
                    onNumericUpdate={handleNumericUpdate}
                    onTimerUpdate={handleTimerUpdate}
                    onChecklistUpdate={handleChecklistUpdate}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Task Form */}
          <TaskForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleAddTask}
          />
        </PageContainer>
      </main>
        
    </div>
  );
};

export default TasksPage;
