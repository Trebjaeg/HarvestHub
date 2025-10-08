'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslatableErrors } from '../../../../../hooks/useTranslatableErrors';

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  email: string;
  onResend: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  onSuccess?: () => void;
}

const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  email,
  onResend,
  isVerifying = false,
  isResending = false,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { setError: setFieldError, getError: getFieldError, clearError: clearFieldError } = useTranslatableErrors();
  const [code, setCode] = useState(['', '', '', '']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  console.log('VerificationCodeModal render - isOpen:', isOpen);
  console.log('VerificationCodeModal render - email:', email);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Add longer delay to ensure modal is fully rendered and visible
      const timer = setTimeout(() => {
        if (inputRefs[0].current) {
          inputRefs[0].current.focus();
          console.log('Focus set to first input');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    console.log('Input change:', { index, value, currentCode: code });
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      console.log('Invalid character rejected:', value);
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    console.log('New code array:', newCode);

    // Clear error when user starts typing
    if (getFieldError('verification')) {
      clearFieldError('verification');
    }

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 4);
    
    if (digits.length > 0) {
      const newCode = digits.split('').concat(['', '', '', '']).slice(0, 4);
      setCode(newCode);
      
      // Focus the next empty input or last input
      const nextIndex = Math.min(digits.length, 3);
      inputRefs[nextIndex].current?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 4) {
      setFieldError('verification', 'auth.validation.verificationCodeRequired');
      return;
    }

    try {
      await onVerify(verificationCode);
      // Don't show success modal here - let parent component handle flow
    } catch (error) {
      // Handle verification error
      console.error('Verification failed:', error);
      setFieldError('verification', 'auth.validation.verificationCodeInvalid');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
    onSuccess?.();
  };

  const handleResend = () => {
    clearFieldError('verification');
    onResend();
  };

  if (!isOpen) return null;

  // Debug logging
  console.log('VerificationCodeModal render:', { 
    isOpen, 
    email,
    code: code.join(''),
    showSuccessModal,
    isVerifying: isVerifying,
    isResending: isResending
  });

  return (
    <>
      <div className="fixed inset-0 backdrop-blur-md bg-white/30 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            {/* Mail Icon */}
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M19 22.5a4.75 4.75 0 0 1 3.5 -3.5a4.75 4.75 0 0 1 -3.5 -3.5a4.75 4.75 0 0 1 -3.5 3.5a4.75 4.75 0 0 1 3.5 3.5" />
                <path d="M11.5 19h-6.5a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v5" />
                <path d="M3 7l9 6l9 -6" />
              </svg>
            </div>

            <h2 className="text-2xl font-medium text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {t('auth.verificationTitle')}
            </h2>
            
            <p className="text-gray-600 mb-8" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
              {t('auth.verificationSubtitle')} <span className="font-medium text-gray-900">{email}</span>
            </p>

            {/* Code Input */}
            <div className="flex justify-center space-x-3 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  onClick={() => inputRefs[index].current?.focus()}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 focus:border-green-500"
                  style={{ 
                    color: '#111827',
                    backgroundColor: '#ffffff'
                  }}
                  disabled={isVerifying}
                />
              ))}
            </div>

            {/* Error Message */}
            {getFieldError('verification') && (
              <div className="mt-2 flex items-center justify-center space-x-1">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-500">{getFieldError('verification')}</p>
              </div>
            )}

            {/* Resend */}
            <p className="text-sm text-gray-600 mt-6" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
              {t('auth.didntGetCode')}{' '}
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-green-600 hover:text-green-800 font-medium underline disabled:opacity-50 disabled:no-underline"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {isResending ? t('auth.resending') : t('auth.clickToResend')}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isVerifying}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
              >
                {t('auth.cancel')}
              </button>
              <button
                onClick={handleVerify}
                disabled={isVerifying || code.join('').length < 4}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('auth.verify')}
                  </div>
                ) : (
                  t('auth.verify')
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerificationCodeModal;