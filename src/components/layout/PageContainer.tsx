import React, { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

const PageContainer = ({ title, children }: PageContainerProps) => {
  return (
    <div className="container px-3 sm:px-4 py-4 sm:py-6 mx-auto mt-16">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{title}</h1>
      {children}
    </div>
  );
};

export default PageContainer;
