
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

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  type: TaskType;
  category?: string;
  dueDate?: Date;
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
      category: 'health'
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
    }
  ]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | TaskType>('all');
  
  const handleTaskComplete = (id: string, completed: boolean) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed } : task
    ));
  };
  
  const handleAddTask = (newTask: Task) => {
    setTasks([...tasks, newTask]);
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
