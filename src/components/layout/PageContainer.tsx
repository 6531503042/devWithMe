
import React, { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

const PageContainer = ({ title, children }: PageContainerProps) => {
  return (
    <div className="container px-4 py-6 mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{title}</h1>
      {children}
    </div>
  );
};

export default PageContainer;
