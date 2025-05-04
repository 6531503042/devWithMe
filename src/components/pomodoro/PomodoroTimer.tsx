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
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';
import { Slider } from '@/components/ui/slider';
import { Timer } from 'lucide-react';
import { SpotifyAuthProvider } from '@/integrations/spotify/SpotifyAuth';
import SpotifyPlaylistSelector from './SpotifyPlaylistSelector';

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
  
  // Separate loading states for different data types
  const [isSessionLoading, setSessionLoading] = useState(false);
  const [isTaskLoading, setTaskLoading] = useState(false);
  const [dataError, setDataError] = useState<boolean>(false);
  
  // New state for theme and media
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('studywithme');
  const [showMediaPlayer, setShowMediaPlayer] = useState<boolean>(false);
  const [mediaType, setMediaType] = useState<'spotify' | 'youtube'>('spotify');
  const [spotifyUrl, setSpotifyUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [useRecommendedPlaylist, setUseRecommendedPlaylist] = useState<boolean>(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const glowPulseRef = useRef<NodeJS.Timeout | null>(null);
  const spotifyEmbedRef = useRef<HTMLIFrameElement | null>(null);
  const youtubeEmbedRef = useRef<HTMLIFrameElement | null>(null);

  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  // Load data when component mounts and user status is resolved, but don't block UI
  useEffect(() => {
    if (isInitialized) {
      fetchUserData();
    }
  }, [user, isInitialized]);

  const fetchUserData = async () => {
    // Only fetch if user is logged in
    if (!user) {
      setSessions([]);
      setTasks([]);
      return;
    }
    
    // Set loading states without blocking UI
    setSessionLoading(true);
    setTaskLoading(true);
    setDataError(false);
    
    try {
      // Fetch sessions in parallel with tasks
      const fetchSessions = async () => {
        const { data: pomodoroData, error: pomodoroError } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(10);
        
        if (pomodoroError) throw pomodoroError;
        setSessions(pomodoroData || []);
        setSessionLoading(false);
      };
      
      const fetchTasks = async () => {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false });
        
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
        setTaskLoading(false);
      };
      
      // Execute both requests in parallel
      await Promise.all([fetchSessions(), fetchTasks()]);
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
      setSessionLoading(false);
      setTaskLoading(false);
    }
  };

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
    
    // Clean up function for component unmounting
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Clean up theme and background
      const existingThemeClasses = Array.from(document.body.classList)
        .filter(cls => cls.startsWith('timer-theme-'));
      
      existingThemeClasses.forEach(cls => {
        document.body.classList.remove(cls);
      });
      
      // Reset background image only if the current one was set by this component
      const currentBg = document.body.style.backgroundImage;
      const themeImages = timerThemes.map(t => t.backgroundImage);
      if (themeImages.some(img => currentBg.includes(img))) {
        document.body.style.backgroundImage = '';
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

  // Reset timer when mode changes
  useEffect(() => {
    setTimeRemaining(timerModes[mode]);
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [mode]);

  // Timer logic with improved exact timing
  useEffect(() => {
    // Handle timer completion - centralized in one place
    const handleTimerCompletion = () => {
      // Stop timer interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Clear the end time reference
      endTimeRef.current = null;
      
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
      
      // Remove from localStorage to prevent duplicate completions
      localStorage.removeItem('pomodoro-timer-state');
    };

    if (isActive && timeRemaining > 0) {
      // Set endTime only when timer starts, not on every render
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + (timeRemaining * 1000);
      }
      
      // Save current timer state to localStorage for persistence across tabs/visibility changes
      localStorage.setItem('pomodoro-timer-state', JSON.stringify({
        mode,
        endTime: endTimeRef.current,
        isActive: true,
        timestamp: Date.now()
      }));
      
      // Use setInterval for more reliable background execution
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          if (!endTimeRef.current) return;
          
          // Calculate remaining time based on the original end time
          const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
          
          // Update the display
          setTimeRemaining(remaining);
          
          // Check if timer completed
          if (remaining <= 0) {
            setIsActive(false);
            handleTimerCompletion();
          }
        }, 500); // Update every 500ms for smooth display without performance impact
      }
      
      // Start pulsing glow effect
      if (!glowPulseRef.current) {
        glowPulseRef.current = setInterval(() => {
          setIsGlowing(prev => !prev);
        }, 2000);
      }
    } else if (timeRemaining === 0) {
      // Timer completed
      setIsActive(false);
      handleTimerCompletion();
    } else if (!isActive) {
      // Timer paused or inactive
      
      // Clear intervals when paused
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Update localStorage for paused state if time remains
      if (timeRemaining > 0) {
        localStorage.setItem('pomodoro-timer-state', JSON.stringify({
          mode,
          timeRemaining,
          isActive: false,
          timestamp: Date.now()
        }));
      } else {
        // Clean up localStorage if timer is reset or completed
        localStorage.removeItem('pomodoro-timer-state');
      }
      
      // Stop glow effect
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        glowPulseRef.current = null;
        setIsGlowing(false);
      }
    }

    // Clean up function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (glowPulseRef.current) {
        clearInterval(glowPulseRef.current);
        glowPulseRef.current = null;
      }
    };
  }, [isActive, timeRemaining, mode, user, toast]);

  // Handle visibility change in a separate effect with proper cleanup
  useEffect(() => {
    // Define visibility change handler - only update timer display when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const savedState = localStorage.getItem('pomodoro-timer-state');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            
            // Only process if the state matches our current mode
            if (state.mode === mode) {
              if (state.endTime && state.isActive) {
                const remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
                
                if (remaining <= 0) {
                  // Timer would have completed while away
                  setIsActive(false);
                  setTimeRemaining(0);
                  endTimeRef.current = null;
                  localStorage.removeItem('pomodoro-timer-state');
                  
                  // Handle completion
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
                } else if (isActive) {
                  // Continue the active timer with corrected time
                  endTimeRef.current = state.endTime;
                  setTimeRemaining(remaining);
                }
              } else if (!state.isActive && state.timeRemaining) {
                // Restore a paused timer
                setTimeRemaining(state.timeRemaining);
                endTimeRef.current = null;
              }
            }
          } catch (error) {
            console.error('Error parsing timer state:', error);
            // Fallback to clean state to avoid stuck timers
            localStorage.removeItem('pomodoro-timer-state');
          }
        }
      }
    };
    
    // Add visibility event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check for a previously active timer on initial load
    const checkSavedTimer = () => {
      const savedState = localStorage.getItem('pomodoro-timer-state');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          
          // Only restore if the mode matches
          if (state.mode === mode) {
            if (state.endTime && state.isActive) {
              const now = Date.now();
              const remaining = Math.max(0, Math.round((state.endTime - now) / 1000));
              
              if (remaining > 0) {
                // Resume the active timer
                endTimeRef.current = state.endTime;
                setTimeRemaining(remaining);
                setIsActive(true);
              } else {
                // Timer would have ended while away - clean up
                localStorage.removeItem('pomodoro-timer-state');
                endTimeRef.current = null;
                setTimeRemaining(0);
                setIsActive(false);
              }
            } else if (!state.isActive && state.timeRemaining) {
              // Restore paused timer state
              setTimeRemaining(state.timeRemaining);
              endTimeRef.current = null;
              setIsActive(false);
            }
          }
        } catch (error) {
          console.error('Error restoring timer state:', error);
          // Clean up to avoid stuck state
          localStorage.removeItem('pomodoro-timer-state');
        }
      }
    };
    
    // Run the check on component mount
    checkSavedTimer();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mode, timerModes, user, toast, isActive]);

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
      await fetchUserData();
      
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
    // Update state
    setTimeRemaining(timerModes[mode]);
    setIsActive(false);
    
    // Clear end time reference
    endTimeRef.current = null;
    
    // Clean up intervals
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
    
    // Clean up localStorage to avoid stuck states
    localStorage.removeItem('pomodoro-timer-state');
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
  
  // Enhanced isDarkTheme function to properly handle all theme types
  const isDarkTheme = (themeId: ThemeOption): boolean => {
    return ['studywithme', 'library', 'dark-academic', 'default'].includes(themeId);
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
  
  // Keep tab text consistent across all themes
  const getTabTextColorClass = () => {
    return 'text-neutral-800';
  };
  
  // Get appropriate timer display shadow class based on theme
  const getTimerDisplayShadowClass = () => {
    return isDarkTheme(selectedTheme) ? 'text-shadow-dark' : 'text-shadow-light';
  };
  
  // Get appropriate input style class based on theme for consistent UI
  const getInputStyleClass = () => {
    if (isDarkTheme(selectedTheme)) {
      return 'bg-black/30 border-white/20 text-white placeholder:text-gray-400';
    } else {
      return 'bg-white/30 border-black/20 text-black placeholder:text-gray-600';
    }
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
      // Handle empty URL
      if (!url || url.trim() === '') {
        // Use lofi beats as fallback
        return 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn';
      }
      
      // Handle different Spotify URL formats
      let embedUrl = url;
      
      // If it's already an embed URL, return it
      if (url.includes('open.spotify.com/embed/')) {
        return url;
      }
      
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
      
      // Ensure we have properly formatted embed URL
      if (!embedUrl.includes('open.spotify.com/embed/')) {
        console.error('Could not create valid embed URL from:', url);
        // Fallback to lofi beats
        return 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn';
      }
      
      // Add compact UI and theme parameters
      if (!embedUrl.includes('?')) {
        embedUrl += '?';
      } else {
        embedUrl += '&';
      }
      embedUrl += 'utm_source=generator&theme=0';
      
      return embedUrl;
    } catch (e) {
      console.error('Error parsing Spotify URL:', e);
      // Fallback to lofi beats
      return 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn';
    }
  };
  
  // Improve the getYoutubeEmbedUrl function to handle errors better
  const getYoutubeEmbedUrl = (url: string) => {
    try {
      // Handle empty URL
      if (!url || url.trim() === '') {
        // Use lofi girl as fallback
        return 'https://www.youtube.com/embed/jfKfPfyJRdk?controls=1&autoplay=0&modestbranding=1&rel=0';
      }
      
      // If it's already an embed URL, return it with additional parameters
      if (url.includes('youtube.com/embed/')) {
        const baseUrl = url.split('?')[0];
        return `${baseUrl}?controls=1&autoplay=0&modestbranding=1&rel=0`;
      }
      
      let videoId = '';
      
      // Extract video ID from URL
      if (url.includes('youtube.com/watch')) {
        try {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v') || '';
        } catch (e) {
          // Fallback for invalid URLs
          const match = url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : '';
        }
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      
      if (!videoId) {
        // Return a default for invalid URLs
        return 'https://www.youtube.com/embed/jfKfPfyJRdk?controls=1&autoplay=0&modestbranding=1&rel=0';
      }
      
      return `https://www.youtube.com/embed/${videoId}?controls=1&autoplay=0&modestbranding=1&rel=0`;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      // Return default on any error
      return 'https://www.youtube.com/embed/jfKfPfyJRdk?controls=1&autoplay=0&modestbranding=1&rel=0';
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
    // Clear any previously set end time when starting timer
    endTimeRef.current = null;
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

  // Add custom scrollbar CSS to remove visible scrollbar
  useEffect(() => {
    // Add custom scrollbar styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }
      .custom-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add custom CSS for the media player with more reliable cleanup
  useEffect(() => {
    // Add custom media player styles
    const styleId = 'pomodoro-media-player-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      /* Media Player Styles */
      .media-player-container {
        transition: all 0.3s ease-in-out;
        max-height: 500px;
        overflow: hidden;
      }
      
      .media-player-container.collapsed {
        max-height: 0;
        margin-top: 0;
        margin-bottom: 0;
        opacity: 0;
      }
      
      .spotify-container iframe,
      .youtube-container iframe {
        background: rgba(0, 0, 0, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        opacity: 0.95;
        transition: opacity 0.3s ease;
        border-radius: 8px;
      }
      
      .spotify-container iframe:hover,
      .youtube-container iframe:hover {
        opacity: 1;
      }
      
      .playlist-scroller {
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 5px;
      }
      
      .playlist-scroller::-webkit-scrollbar {
        display: none;
      }
      
      .playlist-button {
        transition: all 0.2s ease;
      }
      
      .playlist-button:hover {
        transform: translateY(-2px);
      }
      
      /* Timer Theme specific styles */
      .timer-theme-studywithme .timer-display {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .timer-theme-minimal .timer-display {
        text-shadow: none;
      }
      
      .timer-theme-dark-academic .timer-display,
      .timer-theme-library .timer-display {
        text-shadow: 0 2px 8px rgba(255, 255, 255, 0.2);
      }
      
      /* Music player tab styles */
      .timer-tabs .music-tab-active {
        background-color: rgba(255, 255, 255, 0.2);
      }
    `;
    
    return () => {
      // More careful cleanup of styles
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Initialize theme and background with better error handling
  useEffect(() => {
    const applyTheme = (themeId: ThemeOption) => {
      try {
        // Reset any existing theme classes to ensure a clean start
        document.body.className = document.body.className
          .split(' ')
          .filter(cls => !cls.startsWith('timer-theme-'))
          .join(' ');
        
        // Find theme configuration
        const themeConfig = timerThemes.find(t => t.id === themeId);
        if (!themeConfig) {
          console.warn(`Theme ${themeId} not found, falling back to default`);
          document.body.classList.add('timer-theme-studywithme');
          return;
        }
        
        // Apply the theme class
        document.body.classList.add(`timer-theme-${themeId}`);
        
        // Apply background image if available
        if (themeConfig.backgroundImage) {
          document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundAttachment = 'fixed';
        }
      } catch (error) {
        console.error('Error applying theme:', error);
        // Fallback to a minimal theme to ensure functionality
        document.body.classList.add('timer-theme-minimal');
      }
    };
    
    // Try to load saved preference from localStorage or default to studywithme
    try {
      const savedTheme = localStorage.getItem('pomodoro-theme') as ThemeOption || 'studywithme';
      setSelectedTheme(savedTheme);
      applyTheme(savedTheme);
      
      // Load media preferences
      const savedSpotifyUrl = localStorage.getItem('pomodoro-spotify-url');
      if (savedSpotifyUrl) {
        setSpotifyUrl(savedSpotifyUrl);
      } else {
        // Set default playlist based on theme
        const themePlaylist = timerThemes.find(t => t.id === savedTheme)?.recommendedPlaylist?.spotify || '';
        setSpotifyUrl(themePlaylist);
      }
      
      const savedYoutubeUrl = localStorage.getItem('pomodoro-youtube-url');
      if (savedYoutubeUrl) {
        setYoutubeUrl(savedYoutubeUrl);
      } else {
        // Set default playlist based on theme
        const themePlaylist = timerThemes.find(t => t.id === savedTheme)?.recommendedPlaylist?.youtube || '';
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
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      // Apply safe fallback
      setSelectedTheme('minimal');
      applyTheme('minimal');
    }
    
    // Initialize alarm sound with error handling
    try {
      if (!alarmAudioRef.current) {
        alarmAudioRef.current = new Audio(ALARM_SOUND_URL);
        alarmAudioRef.current.volume = 0.7;
      }
    } catch (error) {
      console.error('Error initializing alarm sound:', error);
    }
    
    // Clean up function for component unmounting
    return () => {
      try {
        // Clean up audio elements
        if (alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current.src = '';
          alarmAudioRef.current = null;
        }
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }
        
        // Clean up theme and background
        const existingThemeClasses = Array.from(document.body.classList)
          .filter(cls => cls.startsWith('timer-theme-'));
        
        existingThemeClasses.forEach(cls => {
          document.body.classList.remove(cls);
        });
        
        // Reset background image only if the current one was set by this component
        const currentBg = document.body.style.backgroundImage;
        const themeImages = timerThemes.map(t => t.backgroundImage);
        if (themeImages.some(img => currentBg.includes(img))) {
          document.body.style.backgroundImage = '';
        }
        
        // Clean up any timers
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        if (glowPulseRef.current) {
          clearInterval(glowPulseRef.current);
          glowPulseRef.current = null;
        }
        
        // Remove any stale state from localStorage
        localStorage.removeItem('pomodoro-timer-state');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  // Wrap the component with the SpotifyAuthProvider
  return (
    <SpotifyAuthProvider>
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
                  className="settings-panel bg-black/80 text-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-h-[85vh] overflow-hidden w-[450px] max-w-[95vw] border border-white/10 rounded-xl flex flex-col"
                >
                  <DialogHeader className="sticky top-0 bg-black/90 backdrop-blur-md z-30 pb-2 pt-4 px-6 border-b border-white/10">
                  <div className="flex justify-between items-center">
                      <DialogTitle className="font-medium text-lg text-white">Timer Settings</DialogTitle>
                    <Button 
                      variant="ghost" 
                        size="icon" 
                      onClick={() => setIsSettingsOpen(false)}
                        className="absolute right-4 top-3 z-50 text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                  </DialogHeader>
                  
                  <div className="settings-content space-y-4 mt-2 px-6 py-4 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar flex-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Settings dialog content */}
                  </div>
                  
                  {/* Add global styles for dialog inputs */}
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .settings-panel input {
                        color: white !important;
                      }
                      .settings-panel input::placeholder {
                        color: rgba(156, 163, 175, 0.8) !important;
                      }
                    `
                  }} />
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
                className={`toggle-player-button backdrop-blur-md border-none ${isDarkTheme(selectedTheme) ? 'bg-black/20 text-white hover:bg-white/20' : 'bg-white/20 text-black hover:bg-black/20'} relative z-20 ${showMediaPlayer ? 'active' : ''}`}
              onClick={() => setShowMediaPlayer(!showMediaPlayer)}
                title={showMediaPlayer ? "Hide Media Player" : "Show Media Player"}
            >
                <Music className="h-4 w-4" />
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
          </div>
        </CardContent>

        {/* Music Player Section - Updated with Spotify Integration */}
        <div className={`mt-3 px-6 pb-6 transition-all duration-300 ${!showMediaPlayer ? 'hidden' : ''}`}>
          <div className="music-player-section rounded-xl backdrop-blur-md p-5 border border-gray-400/20 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-medium ${getFontColorClass()}`}>Music Player</h3>
            </div>
            
            <Tabs 
              value={mediaType} 
              onValueChange={(value) => setMediaType(value as 'spotify' | 'youtube')}
              className="w-full"
            >
              <div className="flex justify-end mb-2">
                <TabsList className="h-8">
                  <TabsTrigger value="spotify" className="text-xs px-3 h-8">
                    <span className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      <span>Spotify</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="text-xs px-3 h-8">
                    <span className="flex items-center gap-1">
                      <Youtube className="h-3 w-3" />
                      <span>YouTube</span>
                    </span>
                  </TabsTrigger>
                </TabsList>
        </div>
              
              <TabsContent value="spotify" className="p-0 m-0">
                <div className="spotify-container mb-4 bg-black/5 rounded-lg p-1">
                  <iframe 
                    ref={spotifyEmbedRef}
                    src={getSpotifyEmbedUrl(spotifyUrl)}
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allow="encrypted-media"
                    className="rounded-lg shadow-md"
                  ></iframe>
                </div>
                <div className="flex justify-end mb-2">
                  <SpotifyPlaylistSelector 
                    onSelectPlaylist={(url) => {
                      setSpotifyUrl(url);
                      if (spotifyEmbedRef.current) {
                        spotifyEmbedRef.current.src = url;
                      }
                      saveMediaUrls();
                    }}
                    currentUrl={spotifyUrl}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="youtube" className="p-0 m-0">
                <div className="youtube-container mb-4 bg-black/5 rounded-lg p-1">
                  <iframe 
                    ref={youtubeEmbedRef}
                    width="100%" 
                    height="240" 
                    src={getYoutubeEmbedUrl(youtubeUrl)}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="rounded-lg shadow-md"
                  ></iframe>
                </div>
                <div className="mt-3 mb-1">
                  <Input
                    placeholder="Paste YouTube URL to change the player"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      if (youtubeEmbedRef.current && e.target.value) {
                        youtubeEmbedRef.current.src = getYoutubeEmbedUrl(e.target.value);
                        saveMediaUrls();
                      }
                    }}
                    className={`h-8 text-sm ${getInputStyleClass()}`}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Quick Playlists */}
            <div className="mt-4">
              <Label className={`text-sm font-medium block mb-2 ${getFontColorClass()}`}>Recommended Playlists</Label>
              <div className="grid grid-cols-4 gap-2">
                {popularPlaylists.slice(0, 8).map((playlist, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`playlist-button h-10 text-xs flex items-center justify-center ${
                      isDarkTheme(selectedTheme) 
                        ? 'bg-black/20 hover:bg-white/10 text-white border-white/20' 
                        : 'bg-white/20 hover:bg-black/10 text-black border-black/20'
                    }`}
                    onClick={() => {
                      if (mediaType === 'spotify') {
                        setSpotifyUrl(playlist.spotify);
                        if (spotifyEmbedRef.current) {
                          spotifyEmbedRef.current.src = getSpotifyEmbedUrl(playlist.spotify);
                        }
                      } else {
                        setYoutubeUrl(playlist.youtube);
                        if (youtubeEmbedRef.current) {
                          youtubeEmbedRef.current.src = getYoutubeEmbedUrl(playlist.youtube);
                        }
                      }
                      setUseRecommendedPlaylist(false);
                      saveMediaUrls();
                    }}
                  >
                    <span className="truncate">{playlist.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Attribution */}
            <div className="text-right mt-4">
              <p className="text-xs text-gray-400">Inspired by devwithme</p>
            </div>
          </div>
        </div>
    </Card>
    </SpotifyAuthProvider>
  );
};

export default PomodoroTimer;

