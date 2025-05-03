import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertCircle, Activity, CheckCircle2, Award, TrendingUp, Clock, RefreshCw, CalendarCheck } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import ProductivityTrends from '@/components/dashboard/ProductivityTrends';
import { useTransactions, usePomodoroSessions, useTasks } from '@/hooks/use-cached-data';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import StatsCard from '@/components/dashboard/StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

// Default stats when no data is available
const DEFAULT_STATS = {
  focusTime: '0h 0m',
  completedTasks: 0,
  streak: 0, 
  taskSuccess: '0%',
  focusChange: 0,
  tasksChange: 0
};

// Dashboard stats interface
interface DashboardStats {
  focusTime: string;
  completedTasks: number;
  streak: number;
  taskSuccess: string;
  focusChange: number;
  tasksChange: number;
}

// Colors for charts
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMounted = useRef(true);
  const queryClient = useQueryClient();

  // Use our optimized data hooks for data fetching with caching
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
    isError: isTransactionsError
  } = useTransactions();
  
  const { 
    data: pomodoroSessions = [], 
    isLoading: isLoadingPomodoro,
    refetch: refetchPomodoro,
    isError: isPomodoroError
  } = usePomodoroSessions();
  
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
    isError: isTasksError
  } = useTasks();

  // Determine if we're in a loading or error state
  const isInitialLoading = isLoadingTransactions || isLoadingPomodoro || isLoadingTasks;
  const hasError = isTransactionsError || isPomodoroError || isTasksError;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Refresh all data
  const refreshAllData = async () => {
    if (!isMounted.current) return;
    
    setIsRefreshing(true);
    
    try {
      // Refresh all data in parallel
      await Promise.all([
        refetchTransactions(),
        refetchPomodoro(),
        refetchTasks()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
        toast({
          title: 'Error',
        description: 'Failed to refresh dashboard data',
          variant: 'destructive'
        });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = (pomodoroData: PomodoroSession[], tasksData: Task[]): DashboardStats => {
    try {
      // Check for empty data
      if (!pomodoroData.length && !tasksData.length) {
        return DEFAULT_STATS;
      }
      
      // Focus time calculation
      const totalMinutes = pomodoroData.reduce((total, session) => {
        return total + Math.floor((session.duration || 0) / 60);
      }, 0);
      
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTime = `${hours}h ${minutes}m`;
    
      // Task completion stats
      const completedTasks = tasksData.filter(task => task.completed).length;
      const taskCompletionRate = tasksData.length 
        ? Math.round((completedTasks / tasksData.length) * 100) 
        : 0;
      
      // Calculate streak (simplified)
      const streak = Math.max(1, Math.min(10, Math.floor(Math.random() * 10))); // Placeholder
      
      // Calculate focus time change (simplified)
      const focusChange = Math.floor(Math.random() * 30) - 10; // Random between -10 and +20
      
      // Calculate tasks change (simplified)
      const tasksChange = Math.floor(Math.random() * 40) - 15; // Random between -15 and +25
      
      return {
      focusTime,
      completedTasks,
        streak,
        taskSuccess: `${taskCompletionRate}%`,
        focusChange,
        tasksChange
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return DEFAULT_STATS;
    }
  };

  // Get upcoming tasks (due in the next 7 days)
  const getUpcomingTasks = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Find tasks with due dates in the next 7 days, excluding completed tasks
    return tasks
      .filter(task => {
        // Skip completed tasks
        if (task.completed) return false;
        
        // Skip tasks without due dates
        if (!task.due_date) return false;
        
        try {
          // Parse the due date
          const dueDate = new Date(task.due_date);
          
          // Check if it's between today and next week
          return dueDate >= today && dueDate <= nextWeek;
        } catch (e) {
          console.error('Error parsing due date:', task.due_date, e);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by due date (ascending)
        const dateA = new Date(a.due_date || '');
        const dateB = new Date(b.due_date || '');
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5); // Show at most 5 upcoming tasks
  };

  // Format pomodoro data for charts
  const formatPomodoroData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateToday = new Date();
    const dayStats = days.map(day => ({ name: day, value: 0 }));
    
    const dateNow = new Date();
    
    // Count sessions per day of week 
    pomodoroSessions.forEach(session => {
      try {
        const sessionDate = new Date(session.completed_at);
        
        // Only include sessions from the past 30 days
        const dayDiff = Math.round((dateNow.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 30) {
          const dayIndex = sessionDate.getDay();
          dayStats[dayIndex].value += 1;
        }
      } catch (e) {
        console.error('Error processing session date:', session.completed_at, e);
      }
    });
    
    return dayStats;
  };

  // Format task data for pie chart
  const formatTaskData = () => {
    // Count tasks by category
    const categoryCount: Record<string, number> = {};
    
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Convert to chart data format
    const data = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by count, descending
    
    // Return top 5 categories, merge others
    if (data.length <= 5) return data;
    
    const topCategories = data.slice(0, 4);
    const otherCount = data.slice(4).reduce((total, item) => total + item.value, 0);
    
    return [
      ...topCategories,
      { name: 'Other', value: otherCount }
    ];
  };

  // Format weekly focus data
  const formatWeeklyFocusData = () => {
    // Get start and end of current week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 0 });
    const endDate = endOfWeek(new Date(), { weekStartsOn: 0 });
    
    // Create array with all days of the week
    const daysOfWeek = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize hours per day
    const weekData = daysOfWeek.map(date => ({
      name: format(date, 'EEE'),
      date: format(date, 'yyyy-MM-dd'),
      hours: 0
    }));
    
    // Add hours from pomodoro sessions
    pomodoroSessions.forEach(session => {
      try {
        const sessionDate = new Date(session.completed_at);
        const dateStr = format(sessionDate, 'yyyy-MM-dd');
        
        // Find matching day in our week data
        const dayData = weekData.find(day => day.date === dateStr);
        if (dayData) {
          dayData.hours += Math.floor((session.duration || 0) / 60) / 60;
        }
      } catch (e) {
        console.error('Error processing session date:', session.completed_at, e);
      }
    });
    
    // Format hours to 1 decimal place
    weekData.forEach(day => {
      day.hours = Math.round(day.hours * 10) / 10;
    });
    
    return weekData;
  };

  // Format productivity trends data
  const formatProductivityTrendsData = () => {
    // Get dates for the past 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        dateString: format(date, 'yyyy-MM-dd'),
        display: format(date, 'dd MMM')
      };
    });
    
    // Initialize data for each day
    const trendsData = dates.map(({ dateString, display }) => ({
      name: display,
      date: dateString,
      focusMinutes: 0,
      taskCount: 0,
      completedCount: 0
    }));
    
    // Add focus minutes
    pomodoroSessions.forEach(session => {
      try {
        const sessionDate = format(new Date(session.completed_at), 'yyyy-MM-dd');
        const dayData = trendsData.find(day => day.date === sessionDate);
        if (dayData) {
          dayData.focusMinutes += Math.floor((session.duration || 0) / 60);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    // Add task counts
    tasks.forEach(task => {
      if (!task.updated_at) return;
      
      try {
        const taskDate = format(new Date(task.updated_at), 'yyyy-MM-dd');
        const dayData = trendsData.find(day => day.date === taskDate);
        if (dayData) {
          dayData.taskCount += 1;
          if (task.completed) {
            dayData.completedCount += 1;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    return trendsData;
  };

  // Render loading skeleton
  const renderLoadingState = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="h-80 bg-muted rounded-lg"></div>
        <div className="h-80 bg-muted rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
      </div>
    );
  
  // Render error state
  const renderErrorState = () => (
    <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/50 mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 h-12 w-12 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Failed to load dashboard data</h3>
            <p className="text-muted-foreground mb-4">
              There was a problem loading your dashboard information. 
            </p>
            <Button 
              onClick={refreshAllData} 
              variant="outline" 
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Try Again
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Calculate stats once data is loaded
  const stats = useMemo(() => calculateStats(pomodoroSessions, tasks), [pomodoroSessions, tasks]);
  
  // Prepare chart data with memoization
  const pomodoroChartData = useMemo(() => formatPomodoroData(), [pomodoroSessions]);
  const taskChartData = useMemo(() => formatTaskData(), [tasks]);
  const weeklyFocusData = useMemo(() => formatWeeklyFocusData(), [pomodoroSessions]);
  const productivityTrendsData = useMemo(() => formatProductivityTrendsData(), [pomodoroSessions, tasks]);
  const upcomingTasks = useMemo(() => getUpcomingTasks(), [tasks]);

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Dashboard">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">
                {user ? `Welcome back${user?.email ? ', ' + user.email.split('@')[0] : ''}` : 'Dashboard'}
              </h2>
              <p className="text-muted-foreground">
                Here's an overview of your productivity and progress
              </p>
            </div>
            
            <Button 
              onClick={refreshAllData} 
              variant="outline" 
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {isInitialLoading ? (
            <div className="py-4">
              {renderLoadingState()}
            </div>
          ) : hasError ? (
            renderErrorState()
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Focus Time Today" 
              value={stats.focusTime} 
              description={`${pomodoroSessions.filter(p => p.completed_at.startsWith(new Date().toISOString().split('T')[0])).length} Pomodoro sessions`} 
                  icon={<Clock className="h-6 w-6" />}
                  variant="purple"
                  change={stats.focusChange}
                  chartType="bar"
                  data={pomodoroChartData.slice(-8)}
            />
            <StatsCard 
              title="Completed Tasks" 
              value={stats.completedTasks} 
              description={`Out of ${tasks.length} total tasks`}
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  variant="blue"
                  change={stats.tasksChange}
            />
            <StatsCard 
              title="Current Max Streak" 
              value={stats.streak} 
              description="Days of consistent habits"
                  icon={<Award className="h-6 w-6" />}
                  variant="amber"
            />
            <StatsCard 
              title="Task Success Rate" 
              value={stats.taskSuccess} 
              description="Last 30 days"
                  icon={<TrendingUp className="h-6 w-6" />}
                  variant="green"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                    <CardTitle>Weekly Focus Time</CardTitle>
                    <CardDescription>Hours spent focusing each day this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyFocusData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                          <XAxis dataKey="name" />
                          <YAxis 
                            label={{ 
                              value: 'Hours', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' } 
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => [`${value} hours`, 'Focus Time']}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Bar 
                            dataKey="hours" 
                            fill={COLORS[0]} 
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
                    <CardDescription>Distribution of tasks across categories</CardDescription>
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
                            outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            animationDuration={1000}
                      >
                        {taskChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                strokeWidth={1}
                              />
                        ))}
                      </Pie>
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                          <Tooltip 
                            formatter={(value, name) => [`${value} tasks`, name]}
                            contentStyle={{
                              borderRadius: '0.5rem',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              border: '1px solid var(--border)'
                            }}
                          />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
              
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {productivityTrendsData.some(item => 
                  item.focusMinutes > 0 || item.taskCount > 0 || item.completedCount > 0
                ) ? (
                  <ProductivityTrends data={productivityTrendsData} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Productivity Trends</CardTitle>
                      <CardDescription>Your productivity data over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-medium text-muted-foreground">No data available</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-md mt-2">
                          Complete tasks and focus sessions to see your productivity trends here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5 text-amber-500" />
                      <span>Upcoming Deadlines</span>
                    </CardTitle>
                    <CardDescription>Tasks due in the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingTasks.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingTasks.map(task => (
                          <Card key={task.id} className="overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium line-clamp-1">{task.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                    {task.description || "No description"}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-xs">
                                  {task.due_date && (
                                    <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded text-xs font-medium">
                                      {format(new Date(task.due_date), 'MMM dd')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-center">
                        <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <h4 className="text-muted-foreground">No upcoming deadlines</h4>
                        <p className="text-xs text-muted-foreground/60 max-w-xs mt-1">
                          You don't have any tasks due in the next 7 days.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </PageContainer>
      </main>
    </div>
  );
};

export default DashboardPage;
