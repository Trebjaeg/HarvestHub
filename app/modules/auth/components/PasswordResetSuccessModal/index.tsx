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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Content */}
        <div className="p-6 text-center">
          {/* Success Message */}
          <div className="mb-8">
            <p className="text-gray-500 text-sm mb-2 text-left" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
              {t('auth.passwordResetComplete')}
            </p>
            <h2 className="text-xl font-medium text-gray-900 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {t('auth.successfully')}
            </h2>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
          >
            {t('auth.continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetSuccessModal;