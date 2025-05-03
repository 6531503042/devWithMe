
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Timer, ListTodo, BarChartBig, Kanban } from 'lucide-react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';

const Index = () => {
  // Feature cards for homepage
  const features = [
    {
      title: 'Pomodoro Timer',
      description: 'Stay focused with timed work sessions and breaks',
      icon: <Timer size={36} />,
      link: '/pomodoro'
    },
    {
      title: 'Task Manager',
      description: 'Organize tasks, habits, and recurring activities',
      icon: <ListTodo size={36} />,
      link: '/tasks'
    },
    {
      title: 'Statistics',
      description: 'Track your productivity trends and habits',
      icon: <BarChartBig size={36} />,
      link: '/dashboard'
    },
    {
      title: 'Development Board',
      description: 'Manage your projects with a kanban workflow',
      icon: <Kanban size={36} />,
      link: '/kanban'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        {/* Hero section */}
        <section className="hero-gradient text-white py-20">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Your Personal Productivity Hub
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-8">
                Streamline your workflow with integrated tools for task management, focused work sessions, and progress tracking
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link to="/pomodoro">Start Timer</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 h-12 px-6">
                  <Link to="/tasks">Manage Tasks</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-16">
          <div className="container px-4 mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Everything You Need To Stay Productive
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Link 
                  key={index} 
                  to={feature.link}
                  className="block group"
                >
                  <div className="bg-card border rounded-xl p-6 h-full shadow-sm card-hover">
                    <div className="text-primary mb-4 transition-transform group-hover:scale-110 duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="bg-secondary py-16">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to boost your productivity?</h2>
              <p className="text-muted-foreground mb-6">
                Get started with SparkHub today and transform how you work
              </p>
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/pomodoro">Start Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default Index;
