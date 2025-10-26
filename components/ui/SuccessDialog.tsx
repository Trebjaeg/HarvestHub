'use client';

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle } from 'lucide-react';

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function SuccessDialog({ isOpen, onClose, title, message }: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="flex flex-col items-center justify-center py-6 px-4">
          {/* Success Icon */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping"></div>
            <div className="relative bg-green-500 rounded-full p-3">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center font-poppins">
            {title}
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 text-center mb-6 font-poppins">
            {message}
          </p>
          
          {/* OK Button */}
          <button
            onClick={onClose}
            className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 font-poppins"
          >
            OK
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
