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
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

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

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

    // Clear both error and success messages when user starts typing
    if (getFieldError('verification')) {
      clearFieldError('verification');
    }
    if (successMessage) {
      setSuccessMessage('');
    }

    // Auto-focus next input
    if (value && index < 5) {
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
    const digits = paste.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length > 0) {
      const newCode = digits.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      setCode(newCode);
      
      // Focus the next empty input or last input
      const nextIndex = Math.min(digits.length, 5);
      inputRefs[nextIndex].current?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setSuccessMessage(''); // Clear success message when showing error
      setFieldError('verification', 'auth.validation.verificationCodeRequired');
      return;
    }

    try {
      setSuccessMessage(''); // Clear any previous success message
      clearFieldError('verification'); // Clear any previous error
      await onVerify(verificationCode);
      setSuccessMessage('Verification code sent! Check your email.');
      // Don't show success modal here - let parent component handle flow
    } catch (error) {
      // Handle verification error
      console.error('Verification failed:', error);
      setSuccessMessage(''); // Clear success message when showing error
      setFieldError('verification', 'auth.validation.verificationCodeInvalid');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
    onSuccess?.();
  };

  const handleResend = () => {
    clearFieldError('verification'); // Clear error when showing success
    setSuccessMessage('Verification code sent! Check your email.');
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          {/* Header with icon and close button */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-3">
              {/* Green key icon */}
              <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M14.52 2c1.029 0 2.015 .409 2.742 1.136l3.602 3.602a3.877 3.877 0 0 1 0 5.483l-2.643 2.643a3.88 3.88 0 0 1 -4.941 .452l-.105 -.078l-5.882 5.883a3 3 0 0 1 -1.68 .843l-.22 .027l-.221 .009h-1.172c-1.014 0 -1.867 -.759 -1.991 -1.823l-.009 -.177v-1.172c0 -.704 .248 -1.386 .73 -1.96l.149 -.161l5.883 -5.882a3.88 3.88 0 0 1 .39 -5.022l2.643 -2.643a3.88 3.88 0 0 1 2.741 -1.136m.495 5h-.02a2 2 0 1 0 0 4h.02a2 2 0 1 0 0 -4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Verify Email
                </h2>
                <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Enter 6-digit code
                </p>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Body */}
          <div className="p-6">
            <p className="text-center text-sm text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              We've sent a code to{' '}
              <span className="font-medium text-green-600">{email}</span>
            </p>

            {/* Code Input */}
            <div className="flex justify-center gap-2 mb-6">
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
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-semibold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300 focus:border-green-500 transition-all"
                  style={{ 
                    color: '#111827',
                    backgroundColor: '#ffffff'
                  }}
                  disabled={isVerifying}
                />
              ))}
            </div>

            {/* Verify Email Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying || code.join('').length < 6}
              className="w-full px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend Code Button */}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full px-6 py-3.5 bg-green-50 hover:bg-green-100 text-green-600 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors mb-4"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {isResending ? 'Resending...' : 'Resend code'}
            </button>

            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {successMessage}
                </p>
              </div>
            )}

            {/* Error Message */}
            {getFieldError('verification') && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {getFieldError('verification')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerificationCodeModal;