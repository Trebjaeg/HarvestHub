'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
}) => {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-16 h-16 text-green-600" strokeWidth={2} />,
      titleColor: 'text-gray-900',
    },
    error: {
      icon: <XCircle className="w-16 h-16 text-red-600" strokeWidth={2} />,
      titleColor: 'text-gray-900',
    },
    warning: {
      icon: <AlertCircle className="w-16 h-16 text-yellow-600" strokeWidth={2} />,
      titleColor: 'text-gray-900',
    },
  };

  const currentConfig = config[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[90vw] max-w-[400px] rounded-xl p-8 gap-6 bg-white border border-gray-200 shadow-xl" 
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="animate-scale-in">
            {currentConfig.icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="text-center">
          <DialogHeader className="space-y-3">
            <DialogTitle 
              className={`text-2xl font-semibold ${currentConfig.titleColor}`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {title}
            </DialogTitle>
            <DialogDescription 
              className="text-base text-gray-600 leading-relaxed" 
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* OK Button */}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-[#40613D] hover:bg-[#2f4a2d] text-white text-base font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            OK
          </Button>
        </div>
      </DialogContent>
      
      <style jsx global>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
      `}</style>
    </Dialog>
  );
};

export default NotificationDialog;
