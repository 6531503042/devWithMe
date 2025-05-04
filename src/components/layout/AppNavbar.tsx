import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Timer, ListTodo, BarChartBig, Kanban, DollarSign, LogOut, User, LogIn } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AppNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, devMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Prevent scrolling when menu is open
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);

  // Clean up overflow style on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
  };
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: <Timer size={20} /> },
    { path: '/pomodoro', label: 'Pomodoro', icon: <Timer size={20} /> },
    { path: '/tasks', label: 'Tasks', icon: <ListTodo size={20} /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChartBig size={20} /> },
    { path: '/finance', label: 'Finance', icon: <DollarSign size={20} /> },
    { path: '/kanban', label: 'Kanban', icon: <Kanban size={20} /> },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Try to sign out normally first
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out (continuing anyway):', error);
      // We continue even if there's an error
    }
    
    // Force clear all authentication-related data regardless of any errors
    localStorage.removeItem('sb-umrvdvmficxunvujisuf-auth-token');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase_auth_state');
    
    // Clear any cookie-based auth tokens as well with expire time in the past
    document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect with hard reload to ensure everything is cleared
    window.location.href = '/';
    
    setTimeout(() => {
      setIsLoggingOut(false);
    }, 2000);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link to="/" className="flex items-center gap-2 z-10">
          <span className="text-primary font-bold text-xl">devWithMe</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-50"
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-x-4">
          {navLinks.slice(1).map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`px-3 py-2 flex items-center gap-2 text-sm font-medium rounded-md transition-colors
                ${isActive(link.path) 
                  ? 'bg-primary/10 text-primary dark:text-primary' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary-foreground'}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span className="text-sm font-medium truncate max-w-[120px]">{user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className="flex items-center gap-1"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu - Overlay style */}
      <div 
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      />
      
      <div 
        className={`md:hidden fixed inset-y-0 right-0 w-[80%] max-w-[300px] bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        id="mobile-menu"
      >
        <div className="p-4 pt-16 h-full overflow-y-auto">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-md text-base font-medium flex items-center gap-3 transition-colors
                  ${isActive(link.path)
                    ? 'bg-primary/10 text-primary dark:text-primary' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary-foreground'}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <div className="border-t mt-4 pt-4">
                <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                  <User size={16} />
                  <span className="truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="block w-full text-left px-4 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                >
                  <LogOut size={20} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="border-t mt-4 pt-4">
                <Link 
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left px-4 py-3 rounded-md text-base font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-3"
                >
                  <LogIn size={20} />
                  Login / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
