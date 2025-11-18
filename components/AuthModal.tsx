"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  actionDescription?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  message = "You need to be logged in to access this feature.",
  actionDescription = "Please log in or sign up to continue."
}) => {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const handleAuth = () => {
    // Navigate immediately without waiting for modal close animation
    router.push('/auth');
    // Close modal in background
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
          isClosing ? 'opacity-0 backdrop-blur-none' : 'opacity-100 backdrop-blur-sm'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Login Required
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-2">
              {message}
            </p>
            <p className="text-gray-500 text-sm text-center mb-8">
              {actionDescription}
            </p>

            {/* Buttons - Side by side */}
            <div className="flex space-x-3">
              {/* Login/Sign Up Button */}
              <button
                onClick={handleAuth}
                className="flex-1 bg-green-800 hover:bg-green-900 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Login/Sign Up
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-gray-50 rounded-b-2xl px-8 py-4">
            <div className="text-center">
              <span className="text-lg font-bold">
                <span className="text-green-700">Harvest</span>
                <span className="text-green-600">Hub</span>
              </span>
              <p className="text-xs text-gray-500 mt-1">Fresh from farm to your table</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;