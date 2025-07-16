import React from 'react';

interface DKLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const DKLogo: React.FC<DKLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: showText ? 'h-8' : 'h-6 w-6',
    md: showText ? 'h-10' : 'h-8 w-8',
    lg: showText ? 'h-12' : 'h-10 w-10'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl', 
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* DK Logo Icon */}
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-dk-primary rounded-md`}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* D Letter */}
          <path
            d="M8 8v24h8c6.6 0 12-5.4 12-12s-5.4-12-12-12H8zm6 6h2c3.3 0 6 2.7 6 6s-2.7 6-6 6h-2V14z"
            fill="white"
          />
          {/* K Letter */}
          <path
            d="M24 8v24h3v-10l8 10h4l-8-10 7-14h-4l-5 10V8h-3z"
            fill="white"
          />
        </svg>
      </div>
      
      {/* Company Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-dk-text ${textSizeClasses[size]}`}>
            DK Enterprises
          </span>
          <span className="text-xs text-dk-text-muted">
            Payroll Management
          </span>
        </div>
      )}
    </div>
  );
};