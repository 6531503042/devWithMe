import React, { useState, useEffect } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Clock, CalendarRange, Award, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { startOfToday, startOfWeek, endOfWeek, format, parseISO, differenceInCalendarDays } from 'date-fns';

// Error boundary component
interface TimerErrorBoundaryProps {
  children: React.ReactNode;
}

interface TimerErrorBoundaryState {
  hasError: boolean;
}

class TimerErrorBoundary extends React.Component<TimerErrorBoundaryProps, TimerErrorBoundaryState> {
  constructor(props: TimerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Timer component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-red-50 border-red-200 p-4">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Timer Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error loading the timer component.
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

const PomodoroPage = () => {
  const [activeTab, setActiveTab] = useState<string>('timer');
  const { user, isInitialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const [weeklyData, setWeeklyData] = useState<{day: string, hours: number}[]>([]);
  const [sessionTypeData, setSessionTypeData] = useState<{name: string, value: number}[]>([]);
  const [focusStats, setFocusStats] = useState({
    todayFocus: '0h 0m',
    weeklyTotal: '0h 0m',
    currentStreak: '0 days',
    sessionsToday: 0,
    sessionsWeek: 0
  });
  const [totalStats, setTotalStats] = useState({
    totalSessions: 0,
    totalHours: '0h 0m',
    bestDay: {
      date: '',
      hours: '0h 0m'
    }
  });

  // Load data when component is ready
  useEffect(() => {
    if (isInitialized) {
      fetchPomodoroStats();
    }
  }, [isInitialized, user]);

  const fetchPomodoroStats = async () => {
    setIsLoading(true);
    
    try {
      if (!user) {
        setWeeklyData([]);
        setSessionTypeData([]);
        setFocusStats({
          todayFocus: '0h 0m',
          weeklyTotal: '0h 0m',
          currentStreak: '0 days',
          sessionsToday: 0,
          sessionsWeek: 0
        });
        setTotalStats({
          totalSessions: 0,
          totalHours: '0h 0m',
          bestDay: {
            date: '',
            hours: '0h 0m'
          }
        });
        setIsLoading(false);
        return;
      }
      
      // Get today's sessions
      const today = startOfToday().toISOString();
      const { data: todaySessions, error: todayError } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', today);
      
      if (todayError) throw todayError;
      
      // Calculate today's focus time
      const todayMinutes = (todaySessions || []).reduce((sum, session) => 
        sum + Math.floor(session.duration / 60), 0);
      const todayHours = Math.floor(todayMinutes / 60);
      const todayRemainingMins = todayMinutes % 60;
      
      // Get weekly sessions
      const weekStart = startOfWeek(new Date()).toISOString();
      const weekEnd = endOfWeek(new Date()).toISOString();
      const { data: weeklySessions, error: weeklyError } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', weekStart)
        .lte('completed_at', weekEnd);
      
      if (weeklyError) throw weeklyError;
      
      // Calculate weekly focus time
      const weeklyMinutes = (weeklySessions || []).reduce((sum, session) => 
        sum + Math.floor(session.duration / 60), 0);
      const weeklyHours = Math.floor(weeklyMinutes / 60);
      const weeklyRemainingMins = weeklyMinutes % 60;
      
      // Get all sessions for streak calculation
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (allSessionsError) throw allSessionsError;
      
      // Calculate streak
      let currentStreak = 0;
      if (allSessions && allSessions.length > 0) {
        const sessionDates = allSessions.map(s => format(parseISO(s.completed_at), 'yyyy-MM-dd'));
        const uniqueDates = [...new Set(sessionDates)];
        uniqueDates.sort((a, b) => b.localeCompare(a)); // Sort descending
        
        const today = format(new Date(), 'yyyy-MM-dd');
        if (uniqueDates[0] === today) {
          currentStreak = 1;
          
          // Count consecutive days
          for (let i = 1; i < uniqueDates.length; i++) {
            const currentDate = parseISO(uniqueDates[i-1]);
            const prevDate = parseISO(uniqueDates[i]);
            const diffDays = differenceInCalendarDays(currentDate, prevDate);
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }
      
      // Prepare weekly chart data
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyChartData = daysOfWeek.map(day => {
        // Get sessions for this day of the week
        const dayOfWeekSessions = (weeklySessions || []).filter(s => 
          format(parseISO(s.completed_at), 'EEE') === day
        );
        
        // Calculate hours
        const minutes = dayOfWeekSessions.reduce((sum, session) => 
          sum + Math.floor(session.duration / 60), 0);
        
        return {
          day,
          hours: parseFloat((minutes / 60).toFixed(1))
        };
      });
      
      // Prepare session type data
      const typeCount = (allSessions || []).reduce((acc: Record<string, number>, session) => {
        acc[session.type] = (acc[session.type] || 0) + 1;
        return acc;
      }, {});
      
      const sessionTypes = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
      
      // Calculate total stats
      const totalMinutes = (allSessions || []).reduce((sum, session) => 
        sum + Math.floor(session.duration / 60), 0);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalRemainingMins = totalMinutes % 60;
      
      // Find best day
      const dailyTotals: Record<string, number> = {};
      (allSessions || []).forEach(session => {
        const date = format(parseISO(session.completed_at), 'yyyy-MM-dd');
        dailyTotals[date] = (dailyTotals[date] || 0) + Math.floor(session.duration / 60);
      });
      
      let bestDay = { date: '', minutes: 0 };
      Object.entries(dailyTotals).forEach(([date, minutes]) => {
        if (minutes > bestDay.minutes) {
          bestDay = { date, minutes };
        }
      });
      
      const bestDayHours = Math.floor(bestDay.minutes / 60);
      const bestDayMins = bestDay.minutes % 60;
      
      // Update state with all statistics
      setFocusStats({
        todayFocus: `${todayHours}h ${todayRemainingMins}m`,
        weeklyTotal: `${weeklyHours}h ${weeklyRemainingMins}m`,
        currentStreak: `${currentStreak} days`,
        sessionsToday: todaySessions?.length || 0,
        sessionsWeek: weeklySessions?.length || 0
      });
      
      setTotalStats({
        totalSessions: allSessions?.length || 0,
        totalHours: `${totalHours}h ${totalRemainingMins}m`,
        bestDay: {
          date: bestDay.date ? format(parseISO(bestDay.date), 'EEEE, MMM d') : '',
          hours: bestDay.minutes ? `${bestDayHours}h ${bestDayMins}m` : '0h 0m'
        }
      });
      
      setWeeklyData(weeklyChartData);
      setSessionTypeData(sessionTypes);
      
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Stats Error',
        description: 'Could not load statistics data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#8B5CF6', '#10B981', '#06B6D4'];

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card className="p-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Loading statistics...</p>
          </CardContent>
        </Card>
      );
    }

    if (!user) {
      return (
        <Card className="mb-4 bg-amber-50 border-amber-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-4 text-amber-800">Sign in to access statistics</h3>
            <p className="text-sm text-amber-700 mb-4">
              Create an account or log in to track your pomodoro sessions and view detailed statistics.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Weekly Focus Hours</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={weeklyData}
                    margin={{ top: 10, right: 10, left: 5, bottom: 30 }}
                  >
                    <XAxis dataKey="day" />
                    <YAxis 
                      label={{ 
                        value: 'Hours', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { 
                          textAnchor: 'middle',
                          fill: 'var(--muted-foreground)',
                          fontSize: 12
                        }
                      }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} hours`, 'Focus Time']}
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '10px 14px'
                      }}
                      cursor={{ 
                        fill: 'rgba(139, 92, 246, 0.05)',
                        strokeWidth: 0
                      }}
                      wrapperStyle={{
                        zIndex: 1000
                      }}
                    />
                    <Bar 
                      dataKey="hours" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      activeBar={{ 
                        fill: 'hsl(var(--primary))', 
                        stroke: 'hsl(var(--primary))',
                        strokeWidth: 2
                      }}
                      isAnimationActive={true}
                      animationDuration={800}
                      onMouseOver={(data) => {
                        // This is just to ensure hover works properly and tooltip stays visible
                        const bar = document.querySelector('.recharts-bar-rectangle');
                        if (bar) bar.classList.add('opacity-100');
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Session Breakdown</h3>
              {sessionTypeData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sessionTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        isAnimationActive={true}
                        animationDuration={800}
                        activeShape={(props) => {
                          const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
                          return (
                            <g>
                              <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="var(--foreground)">
                                {payload.name}
                              </text>
                              <text x={cx} y={cy} dy={20} textAnchor="middle" fill="var(--foreground)" fontSize={20} fontWeight="bold">
                                {value} sessions
                              </text>
                              <Sector
                                cx={cx}
                                cy={cy}
                                innerRadius={innerRadius}
                                outerRadius={outerRadius + 6}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={fill}
                                strokeWidth={2}
                                stroke={fill}
                              />
                            </g>
                          );
                        }}
                      >
                        {sessionTypeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            strokeWidth={0}
                            style={{
                              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} sessions`, '']}
                        contentStyle={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          padding: '10px 14px'
                        }}
                        wrapperStyle={{
                          zIndex: 1000
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No sessions recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>        
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1 py-8 md:py-12 mt-12 flex items-center justify-center pomodoro-main-container">
        <PomodoroTimer />
      </main>
      
    </div>
  );
};

export default PomodoroPage;
