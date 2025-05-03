
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import { CheckCircle, Clock, ListChecks, BarChart } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <PageContainer title="Welcome to TaskManager">
      <div className="py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">TaskManager</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your all-in-one productivity solution to manage tasks, track habits, and boost focus with Pomodoro.
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" size="lg">Login</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <CheckCircle className="w-10 h-10 text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Task Management</h2>
              <p className="text-gray-600">Create, organize and track your tasks with ease. Set due dates, priorities, and categories.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <Clock className="w-10 h-10 text-blue-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Pomodoro Timer</h2>
              <p className="text-gray-600">Boost your productivity with the Pomodoro technique. Work in focused intervals with timed breaks.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <ListChecks className="w-10 h-10 text-purple-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Habit Tracking</h2>
              <p className="text-gray-600">Build better habits with daily tracking, streaks, and progress visualization.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <BarChart className="w-10 h-10 text-orange-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Insightful Analytics</h2>
              <p className="text-gray-600">Understand your productivity patterns with detailed statistics and visualizations.</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer >
  );
};

export default Index;
