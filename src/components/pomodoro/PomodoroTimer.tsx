
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const timerModes = {
  pomodoro: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

const PomodoroTimer = () => {
  const [mode, setMode] = useState<keyof typeof timerModes>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(timerModes[mode]);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState<{ type: string, duration: number, timestamp: number }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when mode changes
  useEffect(() => {
    setTimeRemaining(timerModes[mode]);
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [mode]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Timer completed
      setIsActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Record the session
      const sessionDuration = timerModes[mode] - timeRemaining;
      if (sessionDuration > 0) {
        setSessions(prev => [
          ...prev, 
          { 
            type: mode, 
            duration: sessionDuration,
            timestamp: Date.now() 
          }
        ]);
      }
      
      // Play sound or notification here
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeRemaining, mode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setTimeRemaining(timerModes[mode]);
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = ((timerModes[mode] - timeRemaining) / timerModes[mode]) * 100;

  return (
    <div className="flex flex-col items-center">
      <Tabs defaultValue="pomodoro" className="w-full max-w-md mb-6" onValueChange={(value) => setMode(value as keyof typeof timerModes)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
          <TabsTrigger value="longBreak">Long Break</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="w-full max-w-md">
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Timer circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              strokeWidth="6%"
              fill="none"
              stroke="#e2e8f0"
              className="dark:opacity-20"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              strokeWidth="6%"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeDasharray={`${2 * Math.PI * 0.45 * 100}`}
              strokeDashoffset={`${2 * Math.PI * 0.45 * 100 * (1 - progressPercentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Timer display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={toggleTimer}
            className="gap-2 h-12 px-6"
            variant="default"
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          
          <Button
            onClick={resetTimer}
            className="gap-2 h-12"
            variant="outline"
          >
            <RefreshCw size={18} />
            Reset
          </Button>
        </div>
      </div>

      {/* Session logs */}
      {sessions.length > 0 && (
        <Card className="w-full max-w-md mt-8">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Today's Sessions</h3>
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="capitalize">{session.type}</span>
                  <span>{Math.floor(session.duration / 60)} min</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PomodoroTimer;
