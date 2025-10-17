'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordResetSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const PasswordResetSuccessModal: React.FC<PasswordResetSuccessModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Content */}
        <div className="p-8">
          {/* Check Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-6 text-center">
            <p className="text-gray-400 text-sm mb-1">
              Your Password has been reset
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              Successfully
            </h2>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetSuccessModal;