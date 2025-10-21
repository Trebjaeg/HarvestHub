import React, { FC } from "react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

const SuccessModal: FC<SuccessModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md bg-white/30 p-4 transition-all duration-500 ease-in-out">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto border border-gray-100 p-8 text-center transition-all duration-500 ease-in-out">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold mb-3 text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Account Created!
        </h2>
        
        {/* Message */}
        <p className="mb-6 text-gray-600 text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Your account was created successfully. Logging you in...
        </p>
        
        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
