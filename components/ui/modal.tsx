"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onAccept: () => void;
  acceptText: string;
}

const Modal: FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onAccept, 
  acceptText 
}) => {
  const { t } = useTranslation();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Check if user has scrolled to within 50px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          {children}
        </div>
        
        {/* Scroll indicator */}
        {!hasScrolledToBottom && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-200">
            <p className="text-sm text-green-700 text-center font-medium">
              ▼ {t('modal.scrollMessage')}
            </p>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 border-gray-300 hover:bg-gray-50"
          >
            {t('modal.cancel')}
          </Button>
          <Button
            variant="default"
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
            className={`px-6 py-2 font-semibold rounded-lg transition ${
              !hasScrolledToBottom 
                ? "opacity-50 cursor-not-allowed bg-gray-400" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {acceptText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
