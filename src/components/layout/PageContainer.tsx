import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ title, children, className }: PageContainerProps) => {
  return (
    <div className={cn("container px-3 sm:px-4 py-4 sm:py-6 mx-auto mt-16", className)}>
      {title && <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{title}</h1>}
      {children}
    </div>
  );
};

export default PageContainer;
