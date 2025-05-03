import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, RefreshCw, Volume2, VolumeX, Clock, CheckCircle, Settings, 
  BarChart, Star, Loader2, Music, Youtube, Palette, ExternalLink, Check, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Timer } from 'lucide-react';

type PomodoroSession = Database['public']['Tables']['pomodoro_sessions']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// Pomodoro themes
type ThemeOption = 'default' | 'seoul' | 'dark-academic' | 'minimal' | 'cafe' | 'library' | 'studywithme';

interface ThemeConfig {
  name: string;
  id: ThemeOption;
  preview: string;
  description: string;
  backgroundImage: string;
  isDark?: boolean; // Added isDark property to explicitly mark dark themes
  recommendedPlaylist?: {
    spotify: string;
    youtube: string;
  }
}

const timerThemes: ThemeConfig[] = [
  { 
    name: 'StudyWithMe', 
    id: 'studywithme', 
    preview: '#ff9c8f',
    description: 'Cozy aesthetic with pink gradient background',
    backgroundImage: 'https://studywithme.io/aesthetic-pomodoro-timer/5d8df2971a0ff103dd00.jpg',
    isDark: true,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn',
      youtube: 'https://www.youtube.com/watch?v=5qap5aO4i9A'
    }
  },
  { 
    name: 'Default', 
    id: 'default', 
    preview: '#7c3aed',
    description: 'Purple theme with gradient background',
    backgroundImage: 'https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    isDark: true,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6',
      youtube: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
    }
  },
  { 
    name: 'Seoul', 
    id: 'seoul', 
    preview: '#fe5d65',
    description: 'Pink theme with library background',
    backgroundImage: 'https://images.unsplash.com/photo-1581001423692-711e2ec53a0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    isDark: false,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX14fiWYoe7Oh',
      youtube: 'https://www.youtube.com/watch?v=NvZtkt9973A'
    }
  },
  {
    name: 'Library',
    id: 'library',
    preview: '#5c4033',
    description: 'Cozy library with wooden shelves',
    backgroundImage: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    isDark: true,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
      youtube: 'https://www.youtube.com/watch?v=5qap5aO4i9A'
    }
  },
  {
    name: 'Cafe',
    id: 'cafe',
    preview: '#8d5c41',
    description: 'Warm coffee shop ambience',
    backgroundImage: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    isDark: false,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT',
      youtube: 'https://www.youtube.com/watch?v=VMAPTo7RVCo'
    }
  },
  { 
    name: 'Dark Academic', 
    id: 'dark-academic', 
    preview: '#70512e',
    description: 'Vintage study room atmosphere',
    backgroundImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    isDark: true,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/6wOxJod1c2yHWUNUZcIRTC',
      youtube: 'https://www.youtube.com/watch?v=5qap5aO4i9A'
    }
  },
  { 
    name: 'Minimal', 
    id: 'minimal', 
    preview: '#f8f8f8',
    description: 'Clean white minimalist design',
    backgroundImage: 'https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    isDark: false,
    recommendedPlaylist: {
      spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn',
      youtube: 'https://www.youtube.com/watch?v=lTRiuFIWV54'
    }
  },
];

// Curated playlists collection
interface PlaylistCollection {
  name: string;
  description: string;
  spotify: string;
  youtube: string;
}

// Collection of popular playlist options
const popularPlaylists: PlaylistCollection[] = [
  {
    name: 'Focus Flow',
    description: 'Instrumental concentration music',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX2L0iB23Enbq',
    youtube: 'https://www.youtube.com/watch?v=jfKfPfyJRdk'
  },
  {
    name: 'Deep Focus',
    description: 'Minimal electronic concentration',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
    youtube: 'https://www.youtube.com/watch?v=tfBVp0Zi2iE'
  },
  {
    name: 'Reading',
    description: 'Perfect for reading sessions',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    youtube: 'https://www.youtube.com/watch?v=M5QY2_8704o'
  },
  {
    name: 'Peaceful Piano',
    description: 'Relaxing piano melodies',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
    youtube: 'https://www.youtube.com/watch?v=XULUBg_ZcAU'
  },
  {
    name: 'Lofi Beats',
    description: 'Chill beats to study/relax to',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn',
    youtube: 'https://www.youtube.com/watch?v=5qap5aO4i9A'
  },
  {
    name: 'Nature Sounds',
    description: 'Calming nature ambience',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWTC99MCpbjP8',
    youtube: 'https://www.youtube.com/watch?v=eKFTSSKCzWA'
  },
  {
    name: 'Cafe Ambience',
    description: 'Coffee shop atmosphere',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT',
    youtube: 'https://www.youtube.com/watch?v=VMAPTo7RVCo'
  },
  {
    name: 'Classical Focus',
    description: 'Classical music for concentration',
    spotify: 'https://open.spotify.com/playlist/37i9dQZF1DWVFeEut75IAL',
    youtube: 'https://www.youtube.com/watch?v=jgpJVI3tDbY'
  }
];

// Reading playlists
const readingPlaylists = {
  spotify: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
  youtube: 'https://www.youtube.com/watch?v=M5QY2_8704o'
};

const timerModes = {
  pomodoro: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

// Ambient sounds
const ambientSounds = [
  { name: 'None', url: '' },
  { name: 'Rainfall', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { name: 'Cafe', url: 'https://assets.mixkit.co/sfx/preview/mixkit-restaurant-ambience-general-575.mp3' },
  { name: 'Ocean Waves', url: 'https://assets.mixkit.co/sfx/preview/mixkit-calm-ocean-waves-loop-1196.mp3' },
  { name: 'Fireplace', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_20a2a3bb4c.mp3' },
  { name: 'Soft Piano', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6c9e0a1.mp3' },
  { name: 'Night Sounds', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8e7639ae6.mp3' },
];

// Alarm sound URL - Apple-like alarm sound
const ALARM_SOUND_URL = 'https://cdn.freesound.org/previews/219/219244_4082826-lq.mp3';

// Add timer mode type
type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const PomodoroTimer = () => {
  const [mode, setModeOriginal] = useState<keyof typeof timerModes>('pomodoro');
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
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
  
  // New state for theme and media
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('studywithme');
  const [showMediaPlayer, setShowMediaPlayer] = useState<boolean>(false);
  const [mediaType, setMediaType] = useState<'spotify' | 'youtube'>('spotify');
  const [spotifyUrl, setSpotifyUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [useRecommendedPlaylist, setUseRecommendedPlaylist] = useState<boolean>(true);
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const glowPulseRef = useRef<NodeJS.Timeout | null>(null);
  const spotifyEmbedRef = useRef<HTMLIFrameElement | null>(null);
  const youtubeEmbedRef = useRef<HTMLIFrameElement | null>(null);

  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  // Initialize with the studywithme theme and apply it to body
  useEffect(() => {
    // Reset any existing theme classes to ensure a clean start
    document.body.className = document.body.className
      .split(' ')
      .filter(cls => !cls.startsWith('timer-theme-'))
      .join(' ');
    
    // Try to load saved preference from localStorage or default to studywithme
    const savedTheme = localStorage.getItem('pomodoro-theme') as ThemeOption || 'studywithme';
    
    // Get the theme config
    const themeConfig = timerThemes.find(t => t.id === savedTheme);
    if (!themeConfig) {
      // Fallback to studywithme if theme not found
      const defaultTheme = timerThemes.find(t => t.id === 'studywithme');
      if (defaultTheme) {
        setSelectedTheme('studywithme');
        document.body.classList.add('timer-theme-studywithme');
        
        if (defaultTheme.backgroundImage) {
          document.body.style.backgroundImage = `url(${defaultTheme.backgroundImage})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundAttachment = 'fixed';
        }
      }
      return;
    }
    
    // Apply the theme class
    document.body.classList.add(`timer-theme-${savedTheme}`);
    setSelectedTheme(savedTheme);
    
    // Apply background image directly and forcefully
    if (themeConfig.backgroundImage) {
      document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
    
    // Force reapplication of theme to ensure it takes effect
    setTimeout(() => {
      // Verify theme is properly applied
      if (!document.body.classList.contains(`timer-theme-${savedTheme}`)) {
        document.body.classList.add(`timer-theme-${savedTheme}`);
      }
      
      // Verify background image is applied
      if (themeConfig.backgroundImage && 
          (!document.body.style.backgroundImage || 
           !document.body.style.backgroundImage.includes(themeConfig.backgroundImage))) {
        document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
    }, 50);
    
    return () => {
      // Clean up theme classes when component unmounts
      document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('timer-theme-'))
        .join(' ');
      document.body.style.backgroundImage = '';
    };
  }, []);

  // Initialize alarm sound and preferences
  useEffect(() => {
    alarmAudioRef.current = new Audio(ALARM_SOUND_URL);
    alarmAudioRef.current.volume = 0.7;
    
    // Try to load saved preferences from localStorage
    const savedTheme = localStorage.getItem('pomodoro-theme');
    if (savedTheme && timerThemes.some(theme => theme.id === savedTheme)) {
      setSelectedTheme(savedTheme as ThemeOption);
      
      // Remove any existing theme classes and apply the saved theme
      const existingThemeClasses = Array.from(document.body.classList)
        .filter(cls => cls.startsWith('timer-theme-'));
      
      existingThemeClasses.forEach(cls => {
        document.body.classList.remove(cls);
      });
      
      // Apply the saved theme
      document.body.classList.add(`timer-theme-${savedTheme}`);
      
      // Find the theme config and apply the background image
      const themeConfig = timerThemes.find(t => t.id === savedTheme);
      if (themeConfig && themeConfig.backgroundImage) {
        document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
      
      // Force theme application to ensure it takes effect
      setTimeout(() => {
        if (!document.body.classList.contains(`timer-theme-${savedTheme}`)) {
          document.body.classList.add(`timer-theme-${savedTheme}`);
        }
        
        // Ensure background image is applied
        if (themeConfig && themeConfig.backgroundImage) {
          if (!document.body.style.backgroundImage.includes(themeConfig.backgroundImage)) {
            document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
          }
        }
      }, 50);
    } else {
      // Default to studywithme theme if no saved preference or invalid theme
      setSelectedTheme('studywithme');
      localStorage.setItem('pomodoro-theme', 'studywithme');
      
      // Apply default theme
      const existingThemeClasses = Array.from(document.body.classList)
        .filter(cls => cls.startsWith('timer-theme-'));
      
      existingThemeClasses.forEach(cls => {
        document.body.classList.remove(cls);
      });
      
      document.body.classList.add('timer-theme-studywithme');
      
      // Apply default studywithme background
      const defaultTheme = timerThemes.find(t => t.id === 'studywithme');
      if (defaultTheme && defaultTheme.backgroundImage) {
        document.body.style.backgroundImage = `url(${defaultTheme.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
    }
    
    // Load saved playlist preferences or set defaults
    const savedSpotifyUrl = localStorage.getItem('pomodoro-spotify-url');
    if (savedSpotifyUrl) {
      setSpotifyUrl(savedSpotifyUrl);
    } else {
      // Set default playlist based on theme
      const defaultTheme = savedTheme as ThemeOption || 'studywithme';
      const themePlaylist = timerThemes.find(t => t.id === defaultTheme)?.recommendedPlaylist?.spotify || '';
      setSpotifyUrl(themePlaylist);
    }
    
    const savedYoutubeUrl = localStorage.getItem('pomodoro-youtube-url');
    if (savedYoutubeUrl) {
      setYoutubeUrl(savedYoutubeUrl);
    } else {
      // Set default playlist based on theme
      const defaultTheme = savedTheme as ThemeOption || 'studywithme';
      const themePlaylist = timerThemes.find(t => t.id === defaultTheme)?.recommendedPlaylist?.youtube || '';
      setYoutubeUrl(themePlaylist);
    }
    
    const savedMediaType = localStorage.getItem('pomodoro-media-type');
    if (savedMediaType === 'spotify' || savedMediaType === 'youtube') {
      setMediaType(savedMediaType);
    }
    
    const savedShowMediaPlayer = localStorage.getItem('pomodoro-show-media');
    if (savedShowMediaPlayer) {
      setShowMediaPlayer(savedShowMediaPlayer === 'true');
    } else {
      // Default to showing media player for better UX
      setShowMediaPlayer(true);
    }
    
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
      }
    };
  }, []);

  // Update playlists when theme changes
  useEffect(() => {
    if (useRecommendedPlaylist) {
      const theme = timerThemes.find(t => t.id === selectedTheme);
      if (theme?.recommendedPlaylist) {
        if (mediaType === 'spotify') {
          setSpotifyUrl(theme.recommendedPlaylist.spotify);
        } else {
          setYoutubeUrl(theme.recommendedPlaylist.youtube);
        }
      }
    }
  }, [selectedTheme, mediaType, useRecommendedPlaylist]);

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
        // Use empty data when not logged in
        setSessions([]);
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
      
      // Use empty data as fallback
      setSessions([]);
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
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, [mode]);

  // Handle visibility change for better cross-tab timer behavior
  useEffect(() => {
    // Define visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When the tab becomes visible again, recalculate the timer
        if (isActive) {
          const savedTimerState = localStorage.getItem('pomodoro-timer-state');
          if (savedTimerState) {
            try {
              const state = JSON.parse(savedTimerState);
              // If there's an end time saved and the timer is active
              if (state.endTime) {
                const remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
                if (remaining > 0) {
                  // Update the timer with the correct remaining time 
                  setTimeRemaining(remaining);
                } else {
                  // Timer would have completed while tab was inactive
                  setTimeRemaining(0);
                  setIsActive(false);
                  
                  // Play alarm and record completion
                  if (alarmAudioRef.current) {
                    alarmAudioRef.current.currentTime = 0;
                    alarmAudioRef.current.play().catch(e => console.log('Alarm audio play failed:', e));
                  }
                  
                  const sessionDuration = timerModes[mode];
                  if (sessionDuration > 0 && user) {
                    saveSession(sessionDuration);
                  } else {
                    toast({
                      title: 'Session Complete',
                      description: `${mode} session completed while you were away!`,
                      variant: 'default'
                    });
                  }
                  
                  // Clear the saved state
                  localStorage.removeItem('pomodoro-timer-state');
                }
              }
            } catch (error) {
              console.error('Error restoring timer state:', error);
            }
          }
        }
      }
    };

    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, mode, user, toast]);

  // Timer logic with improved exact timing
  useEffect(() => {
    // Handle timer completion
    const handleTimerComplete = () => {
      // Stop the animation frame
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop glow effect
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        glowPulseRef.current = null;
        setIsGlowing(false);
      }
      
      // Play alarm sound
      if (alarmAudioRef.current) {
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current.play().catch(e => console.log('Alarm audio play failed:', e));
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
    };

    if (isActive && timeRemaining > 0) {
      // Calculate the exact end time based on current time and remaining seconds
      const startTime = Date.now();
      const expectedEndTime = startTime + (timeRemaining * 1000);
      
      // Save current timer state to localStorage for tab visibility changes
      const timerState = {
        mode,
        timeRemaining,
        isActive,
        endTime: expectedEndTime,
        timestamp: Date.now()
      };
      localStorage.setItem('pomodoro-timer-state', JSON.stringify(timerState));
      
      // Use requestAnimationFrame for more reliable updates
      const updateTimer = () => {
        // Only update if the tab is visible
        if (document.visibilityState === 'visible') {
          const currentTime = Date.now();
          // Calculate remaining time based on expected end time
          const remaining = Math.max(0, Math.round((expectedEndTime - currentTime) / 1000));
          
          // Update UI with the calculated time
          setTimeRemaining(remaining);
          
          // Check if timer completed
          if (remaining <= 0) {
            setIsActive(false);
            handleTimerComplete();
            return;
          }
        }
        
        // Continue animation loop if still active
        if (isActive) {
          timerRef.current = requestAnimationFrame(updateTimer);
        }
      };
      
      // Start the timer loop
      timerRef.current = requestAnimationFrame(updateTimer);
      
      // Start pulsing glow effect when timer is active
      if (glowPulseRef.current) clearInterval(glowPulseRef.current);
      glowPulseRef.current = setInterval(() => {
        setIsGlowing(prev => !prev);
      }, 2000);
    } else if (timeRemaining === 0) {
      // Timer completed
      setIsActive(false);
      handleTimerComplete();
      
      // Clear saved state
      localStorage.removeItem('pomodoro-timer-state');
    } else if (!isActive) {
      // Timer paused - update localStorage
      const timerState = {
        mode,
        timeRemaining,
        isActive: false,
        endTime: null,
        timestamp: Date.now()
      };
      localStorage.setItem('pomodoro-timer-state', JSON.stringify(timerState));
      
      // Stop animation frame
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
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
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        glowPulseRef.current = null;
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
      cancelAnimationFrame(timerRef.current);
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
    // Default colors based on mode
    if (selectedTheme === 'default') {
      switch (mode) {
        case 'pomodoro': return 'text-primary';
        case 'shortBreak': return 'text-emerald-500';
        case 'longBreak': return 'text-cyan-500';
        default: return 'text-primary';
      }
    } else {
      // For themed versions, use the theme colors
      return 'text-inherit';
    }
  };

  const getGlowClass = () => {
    if (!isActive) return '';
    
    // For custom themes, use the theme-based glow
    if (selectedTheme !== 'default') {
      return '';
    }
    
    const baseClass = 'transition-all duration-1000';
    
    switch (mode) {
      case 'pomodoro': return `${baseClass} timer-glow-pomodoro ${isGlowing ? 'timer-glow-bright' : 'timer-glow-dim'}`;
      case 'shortBreak': return `${baseClass} timer-glow-short-break ${isGlowing ? 'timer-glow-bright' : 'timer-glow-dim'}`;
      case 'longBreak': return `${baseClass} timer-glow-long-break ${isGlowing ? 'timer-glow-bright' : 'timer-glow-dim'}`;
      default: return '';
    }
  };

  const getThemeClass = () => {
    return `timer-theme-${selectedTheme}`;
  };

  const getBackgroundGradient = () => {
    if (selectedTheme === 'studywithme') {
      return 'bg-transparent'; // Use transparent background for studywithme theme
    } else if (selectedTheme === 'seoul') {
      return 'bg-gradient-to-br from-pink-300 to-rose-600';
    } else if (selectedTheme === 'dark-academic') {
      return 'bg-gradient-to-br from-amber-700 to-stone-900';
    } else if (selectedTheme === 'minimal') {
      return 'bg-white';
    } else if (selectedTheme === 'cafe') {
      return 'bg-gradient-to-br from-amber-200 to-amber-700';
    } else if (selectedTheme === 'library') {
      return 'bg-gradient-to-br from-amber-800 to-stone-800';
    } else {
      // Default/fallback gradient
      return 'bg-gradient-to-br from-purple-500 to-indigo-700';
    }
  };
  
  // Enhanced isDarkTheme function using the explicit isDark property
  const isDarkTheme = (themeId: ThemeOption): boolean => {
    const theme = timerThemes.find(t => t.id === themeId);
    return theme?.isDark ?? ['studywithme', 'library', 'dark-academic', 'default'].includes(themeId);
  };
  
  // Helper function to get appropriate font color class based on theme
  const getFontColorClass = () => {
    return isDarkTheme(selectedTheme) ? 'text-white' : 'text-black';
  };

  // Enhanced getSettingsIconClass to ensure visibility based on theme
  const getSettingsIconClass = () => {
    if (isDarkTheme(selectedTheme)) {
      return 'text-white bg-black/30 hover:bg-white/20';
    }
    return 'text-black bg-white/30 hover:bg-black/20';
  };
  
  // Get appropriate timer display shadow class based on theme
  const getTimerDisplayShadowClass = () => {
    return isDarkTheme(selectedTheme) ? 'text-shadow-dark' : 'text-shadow-light';
  };
  
  // Helper to get appropriate tab text color
  const getTabTextColorClass = () => {
    // Default to neutral-800 for better readability on all backgrounds
    return 'text-neutral-800';
  };
  
  // Handle theme change function to properly manage body classes  
  const changeTheme = (theme: ThemeOption) => {
    // Get the selected theme configuration
    const themeConfig = timerThemes.find(t => t.id === theme);
    if (!themeConfig) return;
    
    // Reset theme classes - critical to properly reset state
    document.body.className = document.body.className
      .split(' ')
      .filter(cls => !cls.startsWith('timer-theme-'))
      .join(' ');
    
    // Add new theme class to body immediately
    document.body.classList.add(`timer-theme-${theme}`);
    
    // Apply background image directly and forcefully to ensure change is visible
    if (themeConfig.backgroundImage) {
      document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
    
    // Update state
    setSelectedTheme(theme);
    
    // Save preference to localStorage
    localStorage.setItem('pomodoro-theme', theme);
    
    // If using recommended playlist, update the playlist
    if (useRecommendedPlaylist && themeConfig.recommendedPlaylist) {
        if (mediaType === 'spotify' && spotifyEmbedRef.current) {
          setSpotifyUrl(themeConfig.recommendedPlaylist.spotify);
          spotifyEmbedRef.current.src = getSpotifyEmbedUrl(themeConfig.recommendedPlaylist.spotify);
        } else if (mediaType === 'youtube' && youtubeEmbedRef.current) {
          setYoutubeUrl(themeConfig.recommendedPlaylist.youtube);
          youtubeEmbedRef.current.src = getYoutubeEmbedUrl(themeConfig.recommendedPlaylist.youtube);
        }
      }
    
    // Double verification to ensure theme is properly applied
    setTimeout(() => {
      // Verify theme class
      if (!document.body.classList.contains(`timer-theme-${theme}`)) {
        document.body.classList.add(`timer-theme-${theme}`);
      }
      
      // Verify background image
      if (themeConfig.backgroundImage && 
          (!document.body.style.backgroundImage || 
           !document.body.style.backgroundImage.includes(themeConfig.backgroundImage))) {
        document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
      }
    }, 50);
    
    toast({
      title: 'Theme Changed',
      description: `Changed to ${themeConfig.name} theme`
    });
  };
  
  const applyReadingPlaylist = () => {
    if (mediaType === 'spotify') {
      setSpotifyUrl(readingPlaylists.spotify);
    } else {
      setYoutubeUrl(readingPlaylists.youtube);
    }
    setUseRecommendedPlaylist(false);
    
    toast({
      title: 'Reading Playlist Applied',
      description: 'Enjoy your reading session with this curated playlist.',
    });
  };
  
  // Get Spotify embed URL from a Spotify URL
  const getSpotifyEmbedUrl = (url: string) => {
    try {
      // Handle different Spotify URL formats
      let embedUrl = url;
      
      // Convert spotify:track:id format
      if (url.startsWith('spotify:')) {
        const parts = url.split(':');
        if (parts.length >= 3) {
          const type = parts[1]; // track, playlist, album
          const id = parts[2];
          embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
        }
      } 
      // Convert regular Spotify URLs
      else if (url.includes('open.spotify.com')) {
        // Handle URLs like https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO
        const urlParts = url.split('open.spotify.com/');
        if (urlParts.length > 1) {
          const path = urlParts[1]; // playlist/37i9dQZF1DX4sWSpwq3LiO
          embedUrl = `https://open.spotify.com/embed/${path}`;
        }
      }
      
      return embedUrl;
    } catch (e) {
      console.error('Error parsing Spotify URL:', e);
      return url;
    }
  };
  
  // Parse YouTube URL to get embed code
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      let videoId = '';
      
      // Extract video ID from URL
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?controls=1&autoplay=0`;
      }
      
      return url;
    } catch (e) {
      console.error('Error parsing YouTube URL:', e);
      return url;
    }
  };
  
  // Save media URLs to localStorage
  const saveMediaUrls = () => {
    localStorage.setItem('pomodoro-spotify-url', spotifyUrl);
    localStorage.setItem('pomodoro-youtube-url', youtubeUrl);
    localStorage.setItem('pomodoro-media-type', mediaType);
    localStorage.setItem('pomodoro-show-media', showMediaPlayer.toString());
    
    toast({
      title: 'Media Preferences Saved',
      description: 'Your media player settings have been saved.',
    });
  };

  // Load saved preferences on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('pomodoro-theme') as ThemeOption || 'studywithme';
    const savedShowMediaPlayer = localStorage.getItem('pomodoro-show-media') === 'true';
    const savedMediaType = localStorage.getItem('pomodoro-media-type') as 'spotify' | 'youtube' || 'spotify';
    const savedSpotifyUrl = localStorage.getItem('pomodoro-spotify-url') || '';
    const savedYoutubeUrl = localStorage.getItem('pomodoro-youtube-url') || '';
    const savedUseRecommendedPlaylist = localStorage.getItem('pomodoro-use-recommended-playlist') === 'true';
    const savedSound = parseInt(localStorage.getItem('pomodoro-sound') || '0', 10);
    const savedSoundPlaying = localStorage.getItem('pomodoro-sound-playing') === 'true';
    
    setSelectedTheme(savedTheme);
    setShowMediaPlayer(savedShowMediaPlayer);
    setMediaType(savedMediaType);
    setSpotifyUrl(savedSpotifyUrl);
    setYoutubeUrl(savedYoutubeUrl);
    setUseRecommendedPlaylist(savedUseRecommendedPlaylist);
    setCurrentSound(savedSound);
    setIsSoundPlaying(savedSoundPlaying);
    
    // Apply the theme to body
    document.body.classList.remove('timer-theme-default', 'timer-theme-seoul', 'timer-theme-dark-academic', 'timer-theme-minimal', 'timer-theme-library', 'timer-theme-cafe', 'timer-theme-studywithme');
    document.body.classList.add(`timer-theme-${savedTheme}`);
    
    // Clean up function - remove class from body when component unmounts
    return () => {
      document.body.classList.remove('timer-theme-default', 'timer-theme-seoul', 'timer-theme-dark-academic', 'timer-theme-minimal', 'timer-theme-library', 'timer-theme-cafe', 'timer-theme-studywithme');
    };
  }, []);

  // Convert mode/timerMode to be consistent
  useEffect(() => {
    setTimerMode(mode as TimerMode);
  }, [mode]);
  
  useEffect(() => {
    setModeOriginal(timerMode as keyof typeof timerModes);
  }, [timerMode]);

  // Define timer functions
  const startTimer = () => {
    setIsActive(true);
  };
  
  const pauseTimer = () => {
    setIsActive(false);
  };
  
  // Helper getter for current timer duration
  const getCurrentTimerDuration = () => {
    switch (timerMode) {
      case 'pomodoro':
        return pomodoroTime;
      case 'shortBreak':
        return shortBreakTime;
      case 'longBreak':
        return longBreakTime;
      default:
        return pomodoroTime;
    }
  };
  
  const currentTimerDuration = getCurrentTimerDuration();
  
  // Whether the reset button should be enabled
  const canReset = !isActive || timeRemaining < currentTimerDuration * 60;

  // Handle ambient sound selection
  const handleAmbientSoundChange = (soundIndex: number) => {
    setCurrentSound(soundIndex);
    setIsSoundPlaying(soundIndex > 0);
    localStorage.setItem('pomodoro-sound', soundIndex.toString());
    localStorage.setItem('pomodoro-sound-playing', (soundIndex > 0).toString());
  };

  // Get current sound name
  const getCurrentSoundName = () => {
    return ambientSounds[currentSound]?.name || 'None';
  };

  // Add useEffect to handle escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isSettingsOpen]);

  if (isLoading) {
    return (
      <Card className="bg-transparent backdrop-blur-md border-none shadow-none max-w-3xl mx-auto">
        <CardContent className="p-6 relative z-10">
          <div className="timer-loading-indicator">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className={isDarkTheme(selectedTheme) ? 'text-white' : 'text-black'}>Loading timer data...</span>
          </div>
          
          <div className="w-full flex justify-center my-6">
            <div className={`timer-display text-6xl md:text-8xl font-bold p-6 md:p-8 rounded-2xl text-center w-64 md:w-80 backdrop-blur-lg opacity-50 ${getFontColorClass()}`}>
              {formatTime(timerModes[mode])}
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className={`w-32 h-14 font-medium backdrop-blur-lg opacity-50 ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white' : 'bg-white/20 text-black'}`}
              disabled
            >
              <Play className="h-5 w-5 mr-2" />
              Start
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={`w-32 h-14 font-medium backdrop-blur-lg opacity-50 ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white' : 'bg-white/20 text-black'}`}
              disabled
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-transparent backdrop-blur-md border-none shadow-none max-w-3xl mx-auto">
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`relative z-20 backdrop-blur-md border border-gray-500/30 ${getSettingsIconClass()}`}
                  aria-label="Open Settings"
                  title="Settings"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogContent 
                className="settings-panel bg-black/80 text-white max-h-[80vh] overflow-y-auto w-[450px] max-w-[95vw]"
              >
                <DialogHeader className="sticky top-0 bg-black/80 backdrop-blur-md z-10 pb-2 pt-1">
                  <div className="flex justify-between items-center">
                    <DialogTitle className="font-medium text-lg text-white">Timer Settings</DialogTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10" 
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
                  
                <div className="settings-content space-y-4 mt-2 pr-2">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Palette className="h-4 w-4" /> Theme
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 theme-grid">
                      {timerThemes.map((theme) => (
                        <div
                          key={theme.id}
                          className={`rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                            selectedTheme === theme.id 
                              ? 'ring-2 ring-primary scale-105 shadow-md timer-theme-active' 
                              : 'ring-1 ring-white/20'
                          }`}
                          onClick={() => changeTheme(theme.id)}
                        >
                          <div 
                            className="h-16 sm:h-20 w-full relative bg-cover bg-center"
                            style={{
                              backgroundColor: theme.preview.startsWith('#') ? theme.preview : undefined,
                              backgroundImage: !theme.preview.startsWith('#') ? `url(${theme.preview})` : undefined
                            }}
                          >
                            {selectedTheme === theme.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Check className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-1 text-xs font-medium text-center">{theme.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4" /> Timer Durations
                    </h4>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pomodoro-duration" className="text-xs">Pomodoro</Label>
                        <div className="flex items-center">
                          <Input
                            id="pomodoro-duration"
                            type="number"
                            value={pomodoroTime}
                            onChange={(e) => setPomodoroTime(parseInt(e.target.value))}
                            className="w-16 h-8 text-center bg-black/20 border-none"
                            min={1}
                            max={120}
                          />
                          <span className="ml-2 text-xs">min</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="short-break-duration" className="text-xs">Short Break</Label>
                        <div className="flex items-center">
                          <Input
                            id="short-break-duration"
                            type="number"
                            value={shortBreakTime}
                            onChange={(e) => setShortBreakTime(parseInt(e.target.value))}
                            className="w-16 h-8 text-center bg-black/20 border-none"
                            min={1}
                            max={30}
                          />
                          <span className="ml-2 text-xs">min</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="long-break-duration" className="text-xs">Long Break</Label>
                        <div className="flex items-center">
                          <Input
                            id="long-break-duration"
                            type="number"
                            value={longBreakTime}
                            onChange={(e) => setLongBreakTime(parseInt(e.target.value))}
                            className="w-16 h-8 text-center bg-black/20 border-none"
                            min={1}
                            max={60}
                          />
                          <span className="ml-2 text-xs">min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Volume2 className="h-4 w-4" /> Audio
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="alarm-volume" className="text-xs">Alarm Volume</Label>
                        <Slider
                          id="alarm-volume"
                          value={[0.7 * 100]}
                          onValueChange={(value) => {
                            if (alarmAudioRef.current) {
                              alarmAudioRef.current.volume = value[0] / 100;
                            }
                          }}
                          max={100}
                          step={1}
                          className="w-32"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ambient-sound" className="text-xs">Ambient Sound</Label>
                        <Select value={currentSound.toString()} onValueChange={(value) => handleAmbientSoundChange(parseInt(value))}>
                          <SelectTrigger id="ambient-sound" className="w-32 h-8 bg-black/20 border-none">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-none">
                            {ambientSounds.map((sound, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {sound.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="ambient-volume" className="text-xs">Ambient Volume</Label>
                        <Slider
                          id="ambient-volume"
                          value={[0.5 * 100]}
                          onValueChange={(value) => {
                            if (audioRef.current) {
                              audioRef.current.volume = value[0] / 100;
                            }
                          }}
                          max={100}
                          step={1}
                          className="w-32"
                          disabled={currentSound === 0}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Music className="h-4 w-4" /> Music Player
                    </h4>
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label htmlFor="player-type" className="text-xs">Player Type</Label>
                        <Tabs 
                          value={mediaType} 
                          onValueChange={(value) => {
                            setMediaType(value as any);
                            
                            // Update local storage
                            localStorage.setItem('pomodoro-player-type', value);
                          }}
                          className="w-full timer-tabs"
                        >
                          <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="none">None</TabsTrigger>
                            <TabsTrigger value="spotify">Spotify</TabsTrigger>
                            <TabsTrigger value="youtube">YouTube</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      
                      {mediaType === 'spotify' && (
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="use-recommended" className="text-xs">Use Recommended Playlist</Label>
                            <Switch 
                              id="use-recommended" 
                              checked={useRecommendedPlaylist}
                              onCheckedChange={setUseRecommendedPlaylist}
                            />
                          </div>
                          
                          {!useRecommendedPlaylist && (
                            <div className="grid gap-2">
                              <Label htmlFor="spotify-url" className="text-xs">Spotify URL or Embed Code</Label>
                              <Input
                                id="spotify-url"
                                value={spotifyUrl}
                                onChange={(e) => setSpotifyUrl(e.target.value)}
                                placeholder="https://open.spotify.com/playlist/..."
                                className="h-8 bg-black/20 border-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {mediaType === 'youtube' && (
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="use-recommended-yt" className="text-xs">Use Recommended Stream</Label>
                            <Switch 
                              id="use-recommended-yt" 
                              checked={useRecommendedPlaylist}
                              onCheckedChange={setUseRecommendedPlaylist}
                            />
                          </div>
                          
                          {!useRecommendedPlaylist && (
                            <div className="grid gap-2">
                              <Label htmlFor="youtube-url" className="text-xs">YouTube URL or Embed Code</Label>
                              <Input
                                id="youtube-url"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="h-8 bg-black/20 border-none"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full timer-start-btn mt-4" 
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Save & Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="text-center flex-1">
              <h2 className={`text-lg font-medium ${getFontColorClass()}`}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</h2>
              <p className={`text-sm ${getFontColorClass()} opacity-75`}>
                Session {pomodorosCompleted + 1} of {sessions.length}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              className={`backdrop-blur-md border-none ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white hover:bg-white/20' : 'bg-white/20 text-black hover:bg-black/20'} relative z-20`}
              onClick={() => setShowMediaPlayer(!showMediaPlayer)}
            >
              {showMediaPlayer ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          <Tabs 
            value={mode} 
            onValueChange={(value) => setModeOriginal(value as keyof typeof timerModes)} 
            className="mb-6 w-full max-w-xs timer-tabs"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="pomodoro" className={getTabTextColorClass()}>Pomodoro</TabsTrigger>
              <TabsTrigger value="shortBreak" className={getTabTextColorClass()}>Short Break</TabsTrigger>
              <TabsTrigger value="longBreak" className={getTabTextColorClass()}>Long Break</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="w-full flex justify-center mb-6">
            <div className={`timer-display text-6xl md:text-8xl font-bold p-6 md:p-8 rounded-2xl text-center w-64 md:w-80 backdrop-blur-lg ${getFontColorClass()} ${getTimerDisplayShadowClass()}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          <div className="flex justify-center mb-8 gap-3">
            {isActive ? (
              <Button
                variant="outline"
                size="lg"
                className={`w-32 h-14 font-medium backdrop-blur-lg ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white border-white/20' : 'bg-white/20 text-black border-black/20'}`}
                onClick={pauseTimer}
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className={`w-32 h-14 font-medium backdrop-blur-lg ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white border-white/20' : 'bg-white/20 text-black border-black/20'}`}
                onClick={startTimer}
              >
                <Play className="h-5 w-5 mr-2" />
                Start
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className={`w-32 h-14 font-medium backdrop-blur-lg ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white border-white/20' : 'bg-white/20 text-black border-black/20'}`}
              onClick={resetTimer}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>
          
          {/* Attribution for studywithme.io */}
          {selectedTheme === 'studywithme' && (
            <div className="fixed bottom-4 right-4 text-white/50 text-xs font-light">
              <p>Inspired by studywithme.io</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;

