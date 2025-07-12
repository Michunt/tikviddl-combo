import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  caption?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', caption }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin`}
      ></div>
      {caption && (
        <p className="mt-2 text-sm text-slate-300">{caption}</p>
      )}
    </div>
  );
};

export default Spinner;
