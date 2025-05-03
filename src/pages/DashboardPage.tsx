import React, { useEffect, useState } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// Mock data for development mode
const mockPomodoroSessions: PomodoroSession[] = [
  {
    id: '1',
    type: 'pomodoro',
    duration: 1500,
    completed_at: new Date().toISOString(),
    user_id: 'dev-user',
    task_id: '1',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'shortBreak',
    duration: 300,
    completed_at: new Date(Date.now() - 3600000).toISOString(),
    user_id: 'dev-user',
    task_id: null,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    description: 'Write the README and API documentation',
    type: 'task',
    category: 'work',
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'dev-user',
    due_date: null,
    numeric_goal_current: null,
    numeric_goal_target: null,
    numeric_goal_unit: null,
    timer_goal_duration: null,
    timer_goal_elapsed: null,
    streak: null,
    best_streak: null
  },
  {
    id: '2',
    title: 'Daily meditation',
    description: 'Practice mindfulness',
    type: 'habit',
    category: 'health',
    completed: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'dev-user',
    due_date: null,
    numeric_goal_current: null,
    numeric_goal_target: null,
    numeric_goal_unit: null,
    timer_goal_duration: null,
    timer_goal_elapsed: null,
    streak: 5,
    best_streak: 10
  }
];

const DashboardPage = () => {
  const { user, devMode } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    focusTime: '0h 0m',
    completedTasks: 0,
    streak: 0,
    taskSuccess: '0%'
  });
  
  // Colors for charts
  const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
  
  useEffect(() => {
    if (user) {
      fetchData();
    } else if (devMode) {
      // Use mock data in development mode
      setPomodoroSessions(mockPomodoroSessions);
      setTasks(mockTasks);
      calculateStats(mockPomodoroSessions, mockTasks);
      setIsLoading(false);
    }
  }, [user, devMode]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get pomodoro sessions
      const { data: pomodoroData, error: pomodoroError } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (pomodoroError) throw pomodoroError;
      setPomodoroSessions(pomodoroData || []);
      
      // Get tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Calculate stats
      calculateStats(pomodoroData || [], tasksData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      if (devMode) {
        // Use mock data in development mode if fetch fails
        setPomodoroSessions(mockPomodoroSessions);
        setTasks(mockTasks);
        calculateStats(mockPomodoroSessions, mockTasks);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (pomodoros: PomodoroSession[], allTasks: Task[]) => {
    // Calculate focus time (today)
    const today = new Date().toISOString().split('T')[0];
    const todayPomodoros = pomodoros.filter(p => p.completed_at.startsWith(today));
    const totalMinutes = todayPomodoros.reduce((sum, p) => sum + p.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTime = `${hours}h ${minutes}m`;
    
    // Count completed tasks
    const completedTasks = allTasks.filter(t => t.completed).length;
    
    // Calculate streak (maximum streak from habits)
    const habitTasks = allTasks.filter(t => t.type === 'habit');
    const maxStreak = habitTasks.length > 0 
      ? Math.max(...habitTasks.map(t => t.streak || 0))
      : 0;
    
    // Calculate task success rate (completed vs total in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTasks = allTasks.filter(t => new Date(t.created_at) >= thirtyDaysAgo);
    const successRate = recentTasks.length > 0
      ? Math.round((recentTasks.filter(t => t.completed).length / recentTasks.length) * 100)
      : 0;
    
    setStats({
      focusTime,
      completedTasks,
      streak: maxStreak,
      taskSuccess: `${successRate}%`
    });
  };

  // Format pomodoro data for the chart (group by hour)
  const formatPomodoroData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayPomodoros = pomodoroSessions.filter(p => p.completed_at.startsWith(today));
    
    const hourMap: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      const hour = i < 10 ? `0${i}` : `${i}`;
      hourMap[hour] = 0;
    }
    
    todayPomodoros.forEach(p => {
      const hour = p.completed_at.split('T')[1].substring(0, 2);
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    
    return Object.entries(hourMap).map(([hour, value]) => {
      const h = parseInt(hour, 10);
      const displayHour = h >= 12 
        ? `${h === 12 ? 12 : h - 12}PM` 
        : `${h === 0 ? 12 : h}AM`;
      return { name: displayHour, value };
    });
  };

  // Format task data by category for the pie chart
  const formatTaskData = () => {
    const categoryMap: Record<string, number> = {};
    
    tasks.forEach(t => {
      const category = t.category || 'Uncategorized';
      if (!categoryMap[category]) categoryMap[category] = 0;
      categoryMap[category]++;
    });
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Keep only top 5 categories
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppNavbar />
        <main className="flex-1">
          <PageContainer title="Dashboard">
            <div className="py-10 text-center">Loading dashboard data...</div>
          </PageContainer>
        </main>
        <AppFooter />
      </div>
    );
  }

  const pomodoroChartData = formatPomodoroData();
  const taskChartData = formatTaskData();

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Focus Time Today" 
              value={stats.focusTime} 
              description={`${pomodoroSessions.filter(p => p.completed_at.startsWith(new Date().toISOString().split('T')[0])).length} Pomodoro sessions`} 
            />
            <StatsCard 
              title="Completed Tasks" 
              value={stats.completedTasks} 
              description={`Out of ${tasks.length} total tasks`}
            />
            <StatsCard 
              title="Current Max Streak" 
              value={stats.streak} 
              description="Days of consistent habits"
            />
            <StatsCard 
              title="Task Success Rate" 
              value={stats.taskSuccess} 
              description="Last 30 days"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Pomodoro Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <StatsCard 
                    title="" 
                    value="" 
                    data={pomodoroChartData} 
                    chartType="bar" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </main>
      
    </div>
  );
};

export default DashboardPage;
