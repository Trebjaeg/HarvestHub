'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'default',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] max-w-[425px] rounded-lg p-4 sm:p-6 gap-4" 
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle 
            className="text-lg sm:text-xl font-semibold leading-tight" 
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {title}
          </DialogTitle>
          <DialogDescription 
            className="text-sm sm:text-base text-gray-600 leading-relaxed" 
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto sm:flex-1 h-10 sm:h-9"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto sm:flex-1 h-10 sm:h-9"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
