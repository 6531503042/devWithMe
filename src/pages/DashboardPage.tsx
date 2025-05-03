
import React from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import StatsCard from '@/components/dashboard/StatsCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardPage = () => {
  // Sample data for charts
  const pomodoroData = [
    { name: '8AM', value: 2 },
    { name: '9AM', value: 3 },
    { name: '10AM', value: 5 },
    { name: '11AM', value: 4 },
    { name: '12PM', value: 1 },
    { name: '1PM', value: 0 },
    { name: '2PM', value: 2 },
    { name: '3PM', value: 4 },
    { name: '4PM', value: 3 },
    { name: '5PM', value: 1 },
  ];
  
  const taskData = [
    { name: 'Coding', value: 8 },
    { name: 'Work', value: 5 },
    { name: 'Personal', value: 3 },
    { name: 'Health', value: 2 },
  ];
  
  const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];
  
  const mockStats = {
    focusTime: '5h 30m',
    completedTasks: 12,
    streak: 5,
    taskSuccess: '78%'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard 
              title="Focus Time Today" 
              value={mockStats.focusTime} 
              description="Total Pomodoro sessions"
            />
            <StatsCard 
              title="Completed Tasks" 
              value={mockStats.completedTasks} 
              description="Out of 16 total tasks"
            />
            <StatsCard 
              title="Current Streak" 
              value={mockStats.streak} 
              description="Days of consecutive activity"
            />
            <StatsCard 
              title="Task Success Rate" 
              value={mockStats.taskSuccess} 
              description="Last 30 days"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pomodoro Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <StatsCard 
                    title="" 
                    value="" 
                    data={pomodoroData} 
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
                        data={taskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskData.map((entry, index) => (
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
      
      <AppFooter />
    </div>
  );
};

export default DashboardPage;
