"use client";

import React from 'react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

interface SmartBackButtonProps {
  className?: string;
  variant?: 'default' | 'mobile' | 'header';
  showText?: boolean;
}

export const SmartBackButton: React.FC<SmartBackButtonProps> = ({ 
  className = '', 
  variant = 'default',
  showText = false 
}) => {
  const { navigateBack, navigationState } = useSmartNavigation();

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center gap-2 transition-colors";
    
    switch (variant) {
      case 'mobile':
        return `${baseClasses} md:hidden text-white hover:bg-white/10 p-2 rounded-lg ${className}`;
      case 'header':
        return `${baseClasses} text-white hover:bg-white/20 p-2 rounded-lg ${className}`;
      default:
        return `${baseClasses} text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg ${className}`;
    }
  };

  const handleClick = () => {
    console.log('🔙 Smart Back Button clicked');
    navigateBack();
  };

  return (
    <button
      onClick={handleClick}
      className={getButtonClasses()}
      aria-label="Go back"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2} 
        stroke="currentColor" 
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      {showText && (
        <span className="text-sm font-medium">
          {navigationState.isFromNotification ? 'Back to Messages' : 'Back'}
        </span>
      )}
    </button>
  );
};