import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { subDays, format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns';
import { Activity, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';

// Define a type for the productivity data
interface ProductivityData {
  date: string;
  focusMinutes: number;
  taskCount: number;
  completedCount: number;
}

interface ProductivityTrendsProps {
  data: ProductivityData[];
  startDate?: Date; // Optional start date to restrict visualization
  endDate?: Date; // Optional end date to restrict visualization
}

const ProductivityTrends = ({ 
  data,
  startDate = subDays(new Date(), 14), // Default to last 14 days
  endDate = new Date() 
}: ProductivityTrendsProps) => {
  const [activeTab, setActiveTab] = React.useState('focus');
  
  // Handle case when there's not enough data
  const hasEnoughData = data.length > 2;
  
  // Colors for the charts
  const focusColor = "#8B5CF6"; // Purple
  const taskColor = "#3B82F6";  // Blue
  const completionColor = "#10B981"; // Green
  const completionRateColor = "#F59E0B"; // Amber
  
  // Format data for the charts
  const formatChartData = () => {
    // Get all days in range
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize data with 0 for each day
    const chartData = daysInRange.map(day => {
      const formattedDate = format(day, 'yyyy-MM-dd');
      
      // Find corresponding data point if exists
      const dataPoint = data.find(d => d.date === formattedDate) || {
        date: formattedDate,
        focusMinutes: 0,
        taskCount: 0,
        completedCount: 0
      };
      
      // Calculate completion rate
      const completionRate = dataPoint.taskCount > 0 
        ? (dataPoint.completedCount / dataPoint.taskCount) * 100 
        : 0;
      
      return {
        date: formattedDate,
        displayDate: format(day, 'MMM dd'),
        focusHours: +(dataPoint.focusMinutes / 60).toFixed(1),
        tasks: dataPoint.taskCount,
        completed: dataPoint.completedCount,
        completionRate: +completionRate.toFixed(1)
      };
    });
    
    return chartData;
  };
  
  // Calculate productivity trends
  const calculateTrends = () => {
    const chartData = formatChartData();
    
    // Calculate focus time trends
    const totalFocusHours = chartData.reduce((sum, day) => sum + day.focusHours, 0);
    const avgFocusHours = chartData.length > 0 ? totalFocusHours / chartData.length : 0;
    
    // Calculate task completion trends
    const totalCompleted = chartData.reduce((sum, day) => sum + day.completed, 0);
    const totalTasks = chartData.reduce((sum, day) => sum + day.tasks, 0);
    const avgTasksPerDay = chartData.length > 0 ? totalTasks / chartData.length : 0;
    const avgCompletedPerDay = chartData.length > 0 ? totalCompleted / chartData.length : 0;
    
    // Calculate overall completion rate
    const overallCompletionRate = totalTasks > 0 
      ? (totalCompleted / totalTasks) * 100 
      : 0;
    
    // Calculate if trends are improving (compare first half with second half)
    const midPoint = Math.floor(chartData.length / 2);
    
    // Handle small datasets more gracefully 
    if (chartData.length <= 2) {
      return {
        totalFocusHours,
        avgFocusHours,
        totalCompleted,
        totalTasks,
        avgTasksPerDay,
        avgCompletedPerDay,
        overallCompletionRate,
        focusTrendImproving: false,
        completionTrendImproving: false,
        firstHalfFocus: 0,
        secondHalfFocus: 0,
        firstHalfCompletion: 0,
        secondHalfCompletion: 0
      };
    }
    
    const firstHalfFocus = chartData.slice(0, midPoint).reduce((sum, day) => sum + day.focusHours, 0);
    const secondHalfFocus = chartData.slice(midPoint).reduce((sum, day) => sum + day.focusHours, 0);
    const focusTrendImproving = secondHalfFocus > firstHalfFocus;
    
    const firstHalfCompletion = chartData.slice(0, midPoint).reduce((sum, day) => sum + day.completed, 0);
    const secondHalfCompletion = chartData.slice(midPoint).reduce((sum, day) => sum + day.completed, 0);
    const completionTrendImproving = secondHalfCompletion > firstHalfCompletion;
    
    return {
      totalFocusHours,
      avgFocusHours,
      totalCompleted,
      totalTasks,
      avgTasksPerDay,
      avgCompletedPerDay,
      overallCompletionRate,
      focusTrendImproving,
      completionTrendImproving,
      firstHalfFocus,
      secondHalfFocus,
      firstHalfCompletion,
      secondHalfCompletion
    };
  };
  
  const chartData = formatChartData();
  const trends = calculateTrends();
  
  // Calculate date range description
  const dateRangeInDays = differenceInDays(endDate, startDate) + 1;
  const dateRangeDescription = dateRangeInDays === 7 
    ? 'Last 7 days' 
    : dateRangeInDays === 14 
      ? 'Last 14 days' 
      : dateRangeInDays === 30 
        ? 'Last 30 days' 
        : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Productivity Trends</CardTitle>
            <CardDescription>{dateRangeDescription}</CardDescription>
          </div>
          <div className="flex items-center text-sm gap-1">
            {hasEnoughData && trends.focusTrendImproving && trends.completionTrendImproving ? (
              <>
                <span className="text-green-600 font-medium">Improving</span>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </>
            ) : (
              <span className="text-muted-foreground">Stable</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasEnoughData ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">Not enough data</h3>
            <p className="text-sm text-muted-foreground/60 max-w-md mt-2">
              Complete tasks and focus sessions to see your productivity trends here.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="focus" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Focus Time</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Task Completion</span>
              </TabsTrigger>
              <TabsTrigger value="rate" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Completion Rate</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="focus" className="mt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <defs>
                      <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={focusColor} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={focusColor} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: 'Hours', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fontSize: 12 } 
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} hours`, 'Focus Time']}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="focusHours" 
                      name="Focus Hours"
                      stroke={focusColor} 
                      fill="url(#focusGradient)"
                      strokeWidth={2}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 border border-purple-100 dark:border-purple-900/50">
                  <div className="text-purple-600 dark:text-purple-400 text-xl font-bold">{trends.totalFocusHours.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Total Focus Hours</div>
                </div>
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 border border-purple-100 dark:border-purple-900/50">
                  <div className="text-purple-600 dark:text-purple-400 text-xl font-bold">{trends.avgFocusHours.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Avg Hours/Day</div>
                </div>
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 border border-purple-100 dark:border-purple-900/50">
                  <div className="text-purple-600 dark:text-purple-400 text-xl font-bold">
                    {trends.focusTrendImproving ? '+' : ''}
                    {trends.firstHalfFocus > 0 
                      ? Math.round((trends.secondHalfFocus - trends.firstHalfFocus) / Math.max(0.1, trends.firstHalfFocus) * 100)
                      : trends.secondHalfFocus > 0 ? 100 : 0
                    }%
                  </div>
                  <div className="text-xs text-muted-foreground">Trend</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: 'Tasks', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fontSize: 12 } 
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} tasks`, '']}
                      contentStyle={{
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="tasks" 
                      name="Total Tasks" 
                      fill={taskColor}
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar 
                      dataKey="completed" 
                      name="Completed" 
                      fill={completionColor}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-100 dark:border-blue-900/50">
                  <div className="text-blue-600 dark:text-blue-400 text-xl font-bold">{trends.totalTasks}</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-100 dark:border-green-900/50">
                  <div className="text-green-600 dark:text-green-400 text-xl font-bold">{trends.totalCompleted}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-100 dark:border-green-900/50">
                  <div className="text-green-600 dark:text-green-400 text-xl font-bold">{Math.round(trends.overallCompletionRate)}%</div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rate" className="mt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ 
                        value: 'Completion %', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fontSize: 12 } 
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Completion Rate']}
                      contentStyle={{
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      name="Completion Rate"
                      stroke={completionRateColor} 
                      strokeWidth={2}
                      dot={{ r: 3, fill: completionRateColor }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-100 dark:border-amber-900/50">
                  <div className="text-amber-600 dark:text-amber-400 text-xl font-bold">
                    {trends.avgTasksPerDay.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks/Day</div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-100 dark:border-amber-900/50">
                  <div className="text-amber-600 dark:text-amber-400 text-xl font-bold">
                    {trends.avgCompletedPerDay.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed/Day</div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-100 dark:border-amber-900/50">
                  <div className="text-amber-600 dark:text-amber-400 text-xl font-bold">
                    {trends.completionTrendImproving ? '+' : ''}
                    {trends.firstHalfCompletion > 0 
                      ? Math.round((trends.secondHalfCompletion - trends.firstHalfCompletion) / Math.max(0.1, trends.firstHalfCompletion) * 100)
                      : trends.secondHalfCompletion > 0 ? 100 : 0
                    }%
                  </div>
                  <div className="text-xs text-muted-foreground">Trend</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityTrends; 