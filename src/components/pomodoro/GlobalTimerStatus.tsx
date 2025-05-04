import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Timer, Pause, Play, X, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';

// Constants for localStorage keys
const TIMER_ACTIVE_KEY = 'pomodoro-is-active';
const TIMER_STATE_KEY = 'pomodoro-timer-state';
const TIMER_END_TIME_KEY = 'pomodoro-end-time';
const TIMER_MODE_KEY = 'pomodoro-mode';
const TIMER_PAUSED_KEY = 'pomodoro-is-paused';
const TIMER_REMAINING_KEY = 'pomodoro-time-remaining';

// Create a small component that can be added to App.tsx to show timer status across all pages
export const GlobalTimerStatus = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [mode, setMode] = useState<string>('pomodoro');
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Format time remaining as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Memoize the checkTimerStatus function to prevent unnecessary re-renders
  const checkTimerStatus = useCallback(() => {
    // First, verify if user is logged in
    if (!user) {
      // If no user, make sure timer is disabled
      setIsTimerActive(false);
      return;
    }

    // Check if timer is active
    const activeStr = localStorage.getItem(TIMER_ACTIVE_KEY);
    const isActive = activeStr === 'true';
    
    // Check if timer is paused
    const pausedStr = localStorage.getItem(TIMER_PAUSED_KEY);
    const isPaused = pausedStr === 'true';
    
    setIsTimerActive(isActive);
    setIsTimerPaused(isPaused);
    
    if (isActive) {
      if (isPaused) {
        // For paused timers, get the saved remaining time
        const remainingStr = localStorage.getItem(TIMER_REMAINING_KEY);
        if (remainingStr) {
          const remaining = parseInt(remainingStr, 10);
          setTimeRemaining(remaining);
        }
      } else {
        // For active timers, calculate from end time
        const endTimeStr = localStorage.getItem(TIMER_END_TIME_KEY);
        if (endTimeStr) {
          const end = JSON.parse(endTimeStr);
          setEndTime(end);
          
          // Calculate remaining time
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((end - now) / 1000));
          setTimeRemaining(remaining);
        }
      }
      
      // Get mode
      const modeStr = localStorage.getItem(TIMER_MODE_KEY);
      if (modeStr) {
        setMode(modeStr);
      }
    }
  }, [user]);

  // Add a function to clear timer state from localStorage
  const clearTimerState = () => {
    localStorage.removeItem(TIMER_ACTIVE_KEY);
    localStorage.removeItem(TIMER_END_TIME_KEY);
    localStorage.removeItem(TIMER_PAUSED_KEY);
    localStorage.removeItem(TIMER_REMAINING_KEY);
    localStorage.removeItem(TIMER_MODE_KEY);
    localStorage.removeItem(TIMER_STATE_KEY);
  };

  // Effect to listen to timer state changes and update timer
  useEffect(() => {
    // Check on mount and periodically
    checkTimerStatus();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if ([TIMER_ACTIVE_KEY, TIMER_END_TIME_KEY, TIMER_MODE_KEY, TIMER_PAUSED_KEY, TIMER_REMAINING_KEY].includes(e.key || '')) {
        checkTimerStatus();
      }
    };
    
    // Listen for timer sync events
    const handleTimerSync = () => {
      checkTimerStatus();
    };
    
    // Listen for timer toggle events
    const handleTimerToggle = () => {
      // We need to re-check status after a short delay to get the updated state
      setTimeout(checkTimerStatus, 50);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pomodoro-timer-sync', handleTimerSync);
    window.addEventListener('pomodoro-timer-toggled', handleTimerToggle);
    
    // Set up periodic updates for the countdown
    const intervalId = setInterval(() => {
      if (!isTimerPaused) {
        checkTimerStatus();
      }
    }, 1000); // Update every second to show accurate countdown
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pomodoro-timer-sync', handleTimerSync);
      window.removeEventListener('pomodoro-timer-toggled', handleTimerToggle);
      clearInterval(intervalId);
    };
  }, [isTimerPaused, checkTimerStatus]);
  
  // Add effect to handle authentication state changes
  useEffect(() => {
    // If user logs out, clear timer state
    if (!user) {
      console.log('[GlobalTimerStatus] User logged out, clearing timer state');
      setIsTimerActive(false);
      clearTimerState();
    }
  }, [user]);
  
  // Get the color based on the current mode
  const getModeColor = () => {
    switch(mode) {
      case 'pomodoro': return 'bg-red-500 hover:bg-red-600 shadow-red-500/40';
      case 'shortBreak': return 'bg-green-500 hover:bg-green-600 shadow-green-500/40';
      case 'longBreak': return 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/40';
      default: return 'bg-primary hover:bg-primary/90 shadow-primary/40';
    }
  };

  // Get the mode display name
  const getModeDisplayName = () => {
    switch(mode) {
      case 'pomodoro': return 'Focus';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Pomodoro';
    }
  };
  
  // Only show if timer is active, user is logged in, and we're not on the pomodoro page
  if (!isTimerActive || !user || location.pathname.includes('/pomodoro') || location.pathname.includes('/auth')) {
    return null;
  }
  
  // Handle toggle play/pause
  const handleToggleTimer = () => {
    // Update localStorage directly for immediate effect
    localStorage.setItem(TIMER_PAUSED_KEY, (!isTimerPaused).toString());
    
    // If pausing, save the current time remaining
    if (!isTimerPaused) {
      localStorage.setItem(TIMER_REMAINING_KEY, JSON.stringify(timeRemaining));
    } else {
      // If resuming, calculate and set a new end time
      const now = new Date().getTime();
      const newEndTime = now + (timeRemaining * 1000);
      localStorage.setItem(TIMER_END_TIME_KEY, JSON.stringify(newEndTime));
    }
    
    // Update local state immediately (optimistic UI update)
    setIsTimerPaused(!isTimerPaused);
    
    // Create an event to toggle the timer in PomodoroTimer
    const event = new CustomEvent('pomodoro-toggle-timer');
    window.dispatchEvent(event);
    
    // Dispatch a follow-up event to notify other components that timer state changed
    setTimeout(() => {
      const syncEvent = new CustomEvent('pomodoro-timer-toggled');
      window.dispatchEvent(syncEvent);
    }, 10);
  };
  
  // Stop timer
  const handleStopTimer = () => {
    // Update localStorage
    localStorage.setItem(TIMER_ACTIVE_KEY, 'false');
    localStorage.removeItem(TIMER_END_TIME_KEY);
    localStorage.removeItem(TIMER_PAUSED_KEY);
    localStorage.removeItem(TIMER_REMAINING_KEY);
    
    // Create an event to stop the timer
    const event = new CustomEvent('pomodoro-stop-timer');
    window.dispatchEvent(event);
    
    // Hide the floating timer
    setIsTimerActive(false);
  };
  
  // Enhance the goToPomodoroPage function to properly preserve timer state
  const goToPomodoroPage = () => {
    console.log('[GlobalTimerStatus] Navigating to Pomodoro page, preserving timer state');
    
    // Make sure we have the latest time remaining value
    if (isTimerPaused) {
      // If paused, we already have the correct time stored
      const timeStr = localStorage.getItem(TIMER_REMAINING_KEY);
      console.log(`[GlobalTimerStatus] Current paused timer state: ${timeStr}s remaining`);
    } else {
      // If active, save the current calculated time for better continuity
      localStorage.setItem(TIMER_REMAINING_KEY, JSON.stringify(timeRemaining));
      console.log(`[GlobalTimerStatus] Saved active timer state: ${timeRemaining}s remaining`);
    }
    
    // Set a flag in sessionStorage to prevent the timer from resetting
    sessionStorage.setItem('pomodoro-navigating-back', 'true');
    
    // Also save a timestamp to detect if navigation gets interrupted
    sessionStorage.setItem('pomodoro-navigation-timestamp', Date.now().toString());
    
    // We create a special event to prevent the timer reset when navigating back
    const event = new CustomEvent('pomodoro-preserve-state');
    window.dispatchEvent(event);
    
    // Navigate to the pomodoro page with state parameter for additional security
    navigate('/pomodoro', { 
      state: { 
        preserveTimer: true,
        timeRemaining: timeRemaining,
        isTimerPaused: isTimerPaused
      } 
    });
  };
  
  // Add a function to handle clicks on the timer to improve mobile experience
  const handleTimerClick = (e: React.MouseEvent) => {
    // Only handle direct clicks on the timer (not on buttons)
    if ((e.target as HTMLElement).tagName !== 'BUTTON') {
      // Toggle controls visibility for touch devices
      setShowControls(!showControls);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`fixed bottom-4 right-4 ${getModeColor()} text-white rounded-xl shadow-lg z-50 
          transition-all duration-300 hover:shadow-xl`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isTimerPaused && setShowControls(false)}
        onClick={handleTimerClick}
      >
        <motion.div 
          className="px-4 py-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); goToPomodoroPage(); }}>
              <Timer className="h-5 w-5" />
              <span className="font-medium">{getModeDisplayName()}</span>
            </div>
            <div className="text-xl font-bold tabular-nums">
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          <AnimatePresence>
            {(showControls || isTimerPaused) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2 mt-3 justify-between"
              >
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopTimer();
                  }}
                  className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Stop</span>
                </motion.button>
                
                <div className="flex gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTimer();
                    }}
                    className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors flex items-center gap-1"
                  >
                    {isTimerPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Pause</span>
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); goToPomodoroPage(); }}
                    className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors flex items-center gap-1"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Go to Timer</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Always visible mini controls for mobile devices */}
          <div className="md:hidden flex gap-2 mt-3 justify-end">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTimer();
              }}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              aria-label={isTimerPaused ? "Resume timer" : "Pause timer"}
            >
              {isTimerPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                goToPomodoroPage();
              }}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              aria-label="Go to timer page"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 