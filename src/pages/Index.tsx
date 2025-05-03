
import React from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn } from 'lucide-react'; 
import { useAuth } from '@/components/auth/AuthProvider';

const features = [
  {
    title: "Task Management",
    description: "Organize your tasks, set priorities, and track progress.",
    link: "/tasks",
    linkText: "Manage Tasks",
  },
  {
    title: "Pomodoro Timer",
    description: "Stay focused with a time management technique.",
    link: "/pomodoro",
    linkText: "Start Timer",
  },
  {
    title: "Dashboard Analytics",
    description: "Visualize your productivity with charts and statistics.",
    link: "/dashboard",
    linkText: "View Dashboard",
  },
  {
    title: "Financial Tracking",
    description: "Keep track of your expenses and income.",
    link: "/finance",
    linkText: "Track Finances",
  }
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
          <PageContainer>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-6">Boost Your Productivity with SparkHub</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                The all-in-one productivity solution to manage tasks, track time, and achieve your goals.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                {user ? (
                  <Button asChild size="lg">
                    <Link to="/tasks">
                      Go to Tasks
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <Link to="/auth">
                      Login / Sign Up
                      <LogIn className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </PageContainer>
        </section>
        
        <section className="py-16">
          <PageContainer>
            <h2 className="text-3xl font-bold mb-10 text-center">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                  <Button asChild variant="outline">
                    <Link to={user ? feature.link : "/auth"}>
                      {feature.linkText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </PageContainer>
        </section>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default Index;
