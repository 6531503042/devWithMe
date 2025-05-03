import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RefreshCw, Volume2, VolumeX, Clock, CheckCircle, Settings, BarChart, Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

const timerModes = {
  pomodoro: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

// Ambient sounds
const ambientSounds = [
  { name: 'None', url: '' },
  { name: 'Rainfall', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { name: 'Forest', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3' },
  { name: 'Cafe', url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-ambience-general-575.mp3' },
  { name: 'Ocean', url: 'https://assets.mixkit.co/sfx/preview/mixkit-calm-ocean-waves-loop-1196.mp3' },
];

// Default sample data for statistics when not logged in
const sampleSessions: PomodoroSession[] = [
  {
    id: '1',
    type: 'pomodoro',
    duration: 1500,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    task_id: null,
    user_id: 'sample-user',
  },
  {
    id: '2',
    type: 'shortBreak',
    duration: 300,
    completed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    task_id: null,
    user_id: 'sample-user',
  }
];

const PomodoroTimer = () => {
  const [mode, setMode] = useState<keyof typeof timerModes>('pomodoro');
  const [timeRemaining, setTimeRemaining] = useState(timerModes[mode]);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<number>(0);
  const [isSoundPlaying, setIsSoundPlaying] = useState<boolean>(false);
  const [isGlowing, setIsGlowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const glowPulseRef = useRef<NodeJS.Timeout | null>(null);

  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  // Load data when component mounts and user status is resolved
  useEffect(() => {
    if (isInitialized) {
      fetchData();
    }
  }, [user, isInitialized]);

  const fetchData = async () => {
    setIsLoading(true);
    setDataError(false);
    
    try {
      // If user is logged in, fetch real data
      if (user) {
        // Fetch pomodoro sessions
        const { data: pomodoroData, error: pomodoroError } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10);
        
        if (pomodoroError) throw pomodoroError;
        setSessions(pomodoroData || []);
        
        // Fetch incomplete tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false });
        
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
      } else {
        // Use sample data when not logged in
        setSessions(sampleSessions);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setDataError(true);
      toast({
        title: 'Error',
        description: 'Failed to load timer data. Using default settings.',
        variant: 'destructive'
      });
      
      // Use sample data as fallback
      setSessions(sampleSessions);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Start pulsing glow effect when timer is active
      if (glowPulseRef.current) clearInterval(glowPulseRef.current);
      glowPulseRef.current = setInterval(() => {
        setIsGlowing(prev => !prev);
      }, 2000);
    } else if (timeRemaining === 0) {
      // Timer completed
      setIsActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop glow effect
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        glowPulseRef.current = null;
        setIsGlowing(false);
      }
      
      // Record the session
      const sessionDuration = timerModes[mode];
      if (sessionDuration > 0 && user) {
        saveSession(sessionDuration);
      } else {
        // Show completion notification even for non-logged in users
        toast({
          title: 'Session Complete',
          description: `${mode} session completed!`,
          variant: 'default'
        });
      }
      
      // Play completion sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } else if (!isActive) {
      // Timer paused
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop glow effect when paused
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        glowPulseRef.current = null;
        setIsGlowing(false);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        setIsGlowing(false);
      }
    };
  }, [isActive, timeRemaining, mode, user, toast]);

  // Handle ambient sound
  useEffect(() => {
    if (currentSound === 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsSoundPlaying(false);
      }
      return;
    }

    // Initialize audio
    if (!audioRef.current) {
      audioRef.current = new Audio(ambientSounds[currentSound].url);
      audioRef.current.loop = true;
    } else {
      audioRef.current.src = ambientSounds[currentSound].url;
    }

    // Handle play/pause
    if (isSoundPlaying) {
      audioRef.current.play().catch(e => {
        console.log('Audio play failed:', e);
        setIsSoundPlaying(false);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentSound, isSoundPlaying]);

  const saveSession = async (duration: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          type: mode,
          duration,
          completed_at: new Date().toISOString(),
          user_id: user.id,
          task_id: selectedTaskId
        });

      if (error) throw error;
      
      // Refresh sessions list
      await fetchData();
      
      toast({
        title: 'Session Complete',
        description: `${mode} session completed successfully!`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: 'Error',
        description: 'Failed to save session, but you completed the timer!',
        variant: 'destructive'
      });
    }
  };

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
    
    // Reset glow effect
    if (glowPulseRef.current) {
      clearInterval(glowPulseRef.current);
      glowPulseRef.current = null;
      setIsGlowing(false);
    }
  };

  const toggleSound = () => {
    setIsSoundPlaying(!isSoundPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCompletedAt = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  const getTimerColor = () => {
    switch (mode) {
      case 'pomodoro': return 'text-primary';
      case 'shortBreak': return 'text-emerald-500';
      case 'longBreak': return 'text-cyan-500';
      default: return 'text-primary';
    }
  };

  const getGlowClass = () => {
    if (!isActive) return '';
    
    const baseClass = 'transition-all duration-1000';
    
    switch (mode) {
      case 'pomodoro': return `${baseClass} timer-glow-pomodoro ${isGlowing ? 'timer-glow-bright' : 'timer-glow-dim'}`;
      case 'shortBreak': return `${baseClass} timer-glow-short-break ${isGlowing ? 'timer-glow-bright' : 'timer-glow-dim'}`;
      case 'longBreak': return `${baseClass} timer-glow-long-break ${isGlowing ? 'timer-glow-bright' : 'timer-glow-dim'}`;
      default: return '';
    }
  };

  const getBackgroundGradient = () => {
    switch (mode) {
      case 'pomodoro':
        return 'bg-gradient-to-b from-primary/5 to-primary/10';
      case 'shortBreak':
        return 'bg-gradient-to-b from-emerald-500/5 to-emerald-500/10';
      case 'longBreak':
        return 'bg-gradient-to-b from-cyan-500/5 to-cyan-500/10';
      default:
        return 'bg-gradient-to-b from-primary/5 to-primary/10';
    }
  };

  if (isLoading && !sessions.length) {
    return (
      <Card className="bg-card border-none shadow-xl">
        <CardContent className="p-8 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg font-medium">Loading timer...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${getBackgroundGradient()} border-none shadow-xl`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          {/* Mode Selection */}
          <div className="mb-8 w-full max-w-md">
            <Tabs 
              value={mode} 
              onValueChange={(val) => setMode(val as keyof typeof timerModes)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                <TabsTrigger value="longBreak">Long Break</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Timer Display */}
          <div className={`${getGlowClass()} flex items-center justify-center w-64 h-64 rounded-full mb-8 relative`}>
            <div className={`text-6xl font-bold ${getTimerColor()}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-8">
            <Button 
              size="lg"
              onClick={toggleTimer}
              className={`${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} text-white`}
            >
              {isActive ? (
                <><Pause className="mr-2 h-5 w-5" /> Pause</>
              ) : (
                <><Play className="mr-2 h-5 w-5" /> Start</>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetTimer}
              title="Reset timer"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleSound}
              disabled={currentSound === 0}
              className={currentSound === 0 ? 'opacity-50' : ''}
              title={isSoundPlaying ? 'Mute ambient sound' : 'Play ambient sound'}
            >
              {isSoundPlaying ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Ambient Sound Selection */}
          <div className="mb-8 w-full max-w-xs">
            <Select 
              value={currentSound.toString()} 
              onValueChange={(val) => setCurrentSound(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ambient Sound" />
              </SelectTrigger>
              <SelectContent>
                {ambientSounds.map((sound, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {sound.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Selection - Only for logged in users */}
          {user && tasks.length > 0 && (
            <div className="mb-8 w-full max-w-md">
              <Select 
                value={selectedTaskId || ''} 
                onValueChange={setSelectedTaskId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task selected</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Session History */}
          {sessions.length > 0 && (
            <div className="w-full">
              <h3 className="font-medium text-lg mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5" /> {user ? 'Your Recent Sessions' : 'Sample Sessions'}
              </h3>
              <div className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <div 
                    key={session.id} 
                    className="flex justify-between items-center p-3 rounded-md bg-background/50 border border-border/50"
                  >
                    <div className="flex items-center">
                      <Badge 
                        variant="outline" 
                        className={
                          session.type === 'pomodoro' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : session.type === 'shortBreak'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                        }
                      >
                        {session.type}
                      </Badge>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {formatCompletedAt(session.completed_at)}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.floor(session.duration / 60)} min
                    </span>
                  </div>
                ))}
              </div>
              
              {!user && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>Sign in to track your pomodoro sessions!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;

