
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Timer, ListTodo, BarChartBig, Kanban, DollarSign, LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const AppNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: <Timer size={20} /> },
    { path: '/pomodoro', label: 'Pomodoro', icon: <Timer size={20} /> },
    { path: '/tasks', label: 'Tasks', icon: <ListTodo size={20} /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChartBig size={20} /> },
    { path: '/finance', label: 'Finance', icon: <DollarSign size={20} /> },
    { path: '/kanban', label: 'Kanban', icon: <Kanban size={20} /> },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="container px-4 py-3 mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-primary font-bold text-xl">SparkHub</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              className="px-3 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-foreground"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          
          {user && (
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span className="text-sm font-medium truncate max-w-[120px]">{user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="flex items-center gap-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary flex items-center gap-2"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            {user && (
              <div className="border-t mt-2 pt-2">
                <div className="px-3 py-2 text-sm text-gray-500">
                  Signed in as: {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AppNavbar;
