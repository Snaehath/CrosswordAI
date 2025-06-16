
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sky-500"></div>
      <p className="text-sky-400">Generating Crossword...</p>
    </div>
  );
};

export default LoadingSpinner;
