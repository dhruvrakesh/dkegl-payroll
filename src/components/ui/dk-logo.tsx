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
      {/* DKEGL Logo Image */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src="/images/logo.jpg"
          alt="DKEGL Logo"
          className="w-full h-full object-contain rounded-md"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback initials - hidden by default */}
        <div 
          className="w-full h-full bg-dk-primary rounded-md items-center justify-center text-white font-bold" 
          style={{ display: 'none' }}
        >
          <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>
            DK
          </span>
        </div>
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