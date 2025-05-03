
import React from 'react';
import { Link } from 'react-router-dom';

const AppFooter = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t mt-auto py-6">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} SparkHub. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground">
              Home
            </Link>
            <Link to="/pomodoro" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground">
              Pomodoro
            </Link>
            <Link to="/tasks" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground">
              Tasks
            </Link>
            <Link to="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
