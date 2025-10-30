'use client';

import { useEffect } from 'react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function AlertDialog({ isOpen, onClose, title, message }: AlertDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      style={{ 
        fontFamily: 'Poppins, sans-serif'
      }}
      onClick={onClose}
    >
      {/* Dialog */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-200 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-6 pb-2">
          <h3 className="text-xl font-bold text-gray-900 text-center">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 text-center text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-colors duration-200"
            style={{ 
              backgroundColor: '#40613D',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d4429'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#40613D'}
          >
            Got it
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
