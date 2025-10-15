"use client";

import { FC, ReactNode } from "react";

interface ForgotPwModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const ForgotPwModal: FC<ForgotPwModalProps> = ({ 
  isOpen, 
  onClose, 
  children,
  className = ""
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md bg-white/30 p-4 transition-all duration-500 ease-in-out ${className}`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto border border-gray-100 transition-all duration-500 ease-in-out">
        {/* Content */}
        {children}
      </div>
    </div>
  );
};

ForgotPwModal.displayName = "ForgotPwModal";

export default ForgotPwModal;
