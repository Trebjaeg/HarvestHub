"use client";

import { FC, ReactNode } from "react";

interface ForgotPwModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const ForgotPwModal: FC<ForgotPwModalProps> = ({ 
  isOpen, 
  onClose, 
  children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/30 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto border border-gray-100">
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default ForgotPwModal;
