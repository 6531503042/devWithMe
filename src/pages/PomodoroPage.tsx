
import React from 'react';
import AppNavbar from '@/components/layout/AppNavbar';
import AppFooter from '@/components/layout/AppFooter';
import PageContainer from '@/components/layout/PageContainer';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';

const PomodoroPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      
      <main className="flex-1">
        <PageContainer title="Pomodoro Timer">
          <div className="max-w-3xl mx-auto">
            <PomodoroTimer />
          </div>
        </PageContainer>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default PomodoroPage;
