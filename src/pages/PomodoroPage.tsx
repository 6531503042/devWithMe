import React, { useState, useEffect } from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Clock, CalendarRange, Award, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Ambient background patterns
const backgroundPatterns = [
  'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0) 70%)',
  'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.1) 100%)',
  'repeating-linear-gradient(45deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 2%, transparent 2%, transparent 4%)',
  'linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(196, 181, 253, 0.1))',
];

// Sample data for charts
const sampleWeeklyData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 4 },
  { day: 'Wed', hours: 3 },
  { day: 'Thu', hours: 5.5 },
  { day: 'Fri', hours: 4.5 },
  { day: 'Sat', hours: 1.5 },
  { day: 'Sun', hours: 0.5 },
];

const sampleSessionTypeData = [
  { name: 'Focus', value: 32 },
  { name: 'Short Break', value: 28 },
  { name: 'Long Break', value: 8 },
];

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
  const [bgPattern, setBgPattern] = useState<number>(0);
  const { user, isInitialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const { toast } = useToast();
  
  const [weeklyData, setWeeklyData] = useState(sampleWeeklyData);
  const [sessionTypeData, setSessionTypeData] = useState(sampleSessionTypeData);
  const [focusStats, setFocusStats] = useState({
    todayFocus: '0h 0m',
    weeklyTotal: '0h 0m',
    currentStreak: '0 days'
  });
  
  // Rotate background pattern
  const changeBackground = () => {
    setBgPattern((prev) => (prev + 1) % backgroundPatterns.length);
  };

  // Load data when component is ready
  useEffect(() => {
    if (isInitialized) {
      setIsLoading(false);
      
      // In a real app, you'd load the stats from the server
      // But for demo purposes, we just simulate a short loading state
      // and use sample data
      try {
        setTimeout(() => {
          setWeeklyData(sampleWeeklyData);
          setSessionTypeData(sampleSessionTypeData);
          setFocusStats({
            todayFocus: '2h 45m',
            weeklyTotal: '16h 30m',
            currentStreak: '6 days'
          });
        }, 500);
      } catch (error) {
        console.error('Error loading stats:', error);
        setStatsError(true);
        toast({
          title: 'Stats Error',
          description: 'Could not load statistics data. Using sample data instead.',
          variant: 'destructive'
        });
      }
    }
  }, [isInitialized, toast]);

  const COLORS = ['#8B5CF6', '#10B981', '#06B6D4'];

  return (
    <div 
      className="flex flex-col min-h-screen transition-all duration-1000"
      style={{ 
        backgroundImage: backgroundPatterns[bgPattern],
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Focus Timer">
          <div className="mb-6 flex justify-end">
            <Button 
              onClick={changeBackground}
              variant="outline"
              size="sm"
              className="text-sm"
            >
              Change Ambience
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="timer" className="flex-1">Timer</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1">Statistics</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timer" className="pt-4 mx-auto max-w-5xl">
              <div className="mx-auto">
                <TimerErrorBoundary>
                  <PomodoroTimer />
                </TimerErrorBoundary>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-medium">Today's Focus</h3>
                    </div>
                    <div className="text-3xl font-bold mt-2">{focusStats.todayFocus}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user ? '7 pomodoro sessions completed' : 'Sample data'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarRange className="h-5 w-5 text-success" />
                      <h3 className="text-lg font-medium">Weekly Total</h3>
                    </div>
                    <div className="text-3xl font-bold mt-2">{focusStats.weeklyTotal}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user ? '42 pomodoro sessions this week' : 'Sample data'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-cyan/10 to-cyan/5 border-cyan/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-cyan" />
                      <h3 className="text-lg font-medium">Current Streak</h3>
                    </div>
                    <div className="text-3xl font-bold mt-2">
                      {focusStats.currentStreak}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user ? 'Keep up the momentum!' : 'Sample data'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-6 mx-auto max-w-5xl">
              {!user && (
                <Card className="mb-4 bg-amber-50 border-amber-200">
                  <CardContent className="p-4 text-amber-800 text-sm">
                    <p>Sign in to track your real pomodoro statistics. Currently showing sample data.</p>
                  </CardContent>
                </Card>
              )}
              
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
                              borderRadius: '0.5rem'
                            }}
                          />
                          <Bar 
                            dataKey="hours" 
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Session Breakdown</h3>
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
                          >
                            {sessionTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} sessions`, '']}
                            contentStyle={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '0.5rem'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium">Total Sessions</h3>
                    <p className="text-3xl font-bold mt-2">68</p>
                    <p className="text-sm text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium">Total Focus Time</h3>
                    <p className="text-3xl font-bold mt-2">34h 15m</p>
                    <p className="text-sm text-muted-foreground mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium">Best Day</h3>
                    <p className="text-3xl font-bold mt-2">5h 30m</p>
                    <p className="text-sm text-muted-foreground mt-1">Thursday, last week</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mx-auto max-w-md">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Timer Settings</h3>
                  <p className="text-muted-foreground">
                    Custom timer settings will be available in a future update. 
                    Currently using the standard Pomodoro settings:
                  </p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center justify-between border-b pb-2">
                      <span>Pomodoro</span>
                      <span className="font-medium">25 minutes</span>
                    </li>
                    <li className="flex items-center justify-between border-b pb-2">
                      <span>Short Break</span>
                      <span className="font-medium">5 minutes</span>
                    </li>
                    <li className="flex items-center justify-between border-b pb-2">
                      <span>Long Break</span>
                      <span className="font-medium">15 minutes</span>
                    </li>
                    <li className="flex items-center justify-between pt-2">
                      <span>Long Break Interval</span>
                      <span className="font-medium">4 sessions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageContainer>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default PomodoroPage;
