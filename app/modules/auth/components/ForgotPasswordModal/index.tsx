import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ForgotPwModal from '../../../../../components/ui/forgotpwmodal';
import VerificationCodeModal from '../VerificationCodeModal';
import PasswordResetModal from '../PasswordResetModal';
import PasswordResetSuccessModal from '../PasswordResetSuccessModal';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { validateEmail } from '../../../../../lib/validate-email';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError(t('auth.validation.emailInvalid'));
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError(t('auth.validation.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t('auth.validation.emailInvalid'));
      return;
    }

    setEmailError('');
    setLoading(true);
    setServerMessage(null);
    setResetUrl(null);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request reset');
      setServerMessage(data.message || 'If that account exists, a reset link was sent.');
      setShowSuccessModal(true); // Show our custom success modal instead
    } catch (err: any) {
      setServerMessage(err.message || 'Failed to request reset');
      setShowSuccessModal(true); // Show success modal even on error for demo
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('handleClose called - resetting all states');
    setEmail('');
    setEmailError('');
    setIsSubmitted(false);
    setShowSuccessModal(false);
    setShowVerificationModal(false);
    setShowPasswordResetModal(false);
    setResetToken(null);
    setServerMessage('');
    setLoading(false);
    setIsVerifying(false);
    setIsResending(false);
    setIsClosing(false);
    onClose();
  };

  const handleSuccessModalContinue = () => {
    console.log('Success modal continue clicked - transitioning to verification modal');
    setShowSuccessModal(false);
    setShowVerificationModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    handleClose();
  };

  const handleVerifyCode = async (code: string) => {
    console.log('Starting verification with code:', code);
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid verification code');
      
      console.log('Verification successful:', data);
      
      // Store the JWT token and proceed to password reset
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setShowVerificationModal(false);
        setShowPasswordResetModal(true);
      } else {
        throw new Error('No reset token received');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      throw new Error(err.message || 'Verification failed');
    } finally {
      console.log('Setting isVerifying to false');
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend code');
      console.log('Code resent successfully');
    } catch (err: any) {
      console.error('Resend failed:', err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    handleClose();
  };

  const handlePasswordResetSuccess = () => {
    console.log('Password reset successful from modal');
    // Close all modals and reset state
    setShowPasswordResetModal(false);
    setShowVerificationModal(false);
    setShowSuccessModal(false);
    setResetToken(null);
    
    // Show success message on first pane
    setServerMessage('Password successfully updated! You can now log in with your new password.');
    setIsSubmitted(true); // Show success state on first pane
    
    // Start fade-out animation after 3 seconds
    setTimeout(() => {
      setIsClosing(true);
    }, 3000);
    
    // Close the entire modal after fade animation completes
    setTimeout(() => {
      onClose(); // Close the entire forgot password modal
    }, 3500); // 500ms for fade animation
  };

  const handleClosePasswordResetModal = () => {
    setShowPasswordResetModal(false);
    handleClose();
  };

  const handleVerificationSuccess = () => {
    handleClose();
  };

  const content = (
    <div className="p-6">
      {/* Title and description */}
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-2 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {t('auth.resetPassword')}
        </h2>
        <p className="text-sm text-gray-600 text-left" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
          {t('auth.resetPasswordInstructions')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {t('auth.email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              type="text"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="hello@harvesthubph.app"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              disabled={loading}
            />
          </div>
          {emailError && (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-800">{emailError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Buttons side by side */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
          >
            {t('auth.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex-1 px-4 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
          >
            {loading ? t('auth.sending') : 'Confirm'}
          </button>
        </div>
      </form>

      {/* Register link */}
      <div className="text-left mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
          {t('auth.dontHaveAccount')}{' '}
          <button 
            onClick={handleClose}
            className="text-green-600 font-medium hover:text-green-700"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {t('auth.register')}
          </button>
        </p>
      </div>
    </div>
  );

  console.log('ForgotPasswordModal render state:', {
    isOpen,
    showSuccessModal,
    showVerificationModal,
    showPasswordResetModal,
    isVerifying,
    isResending,
    email
  });

  return (
    <>
      <ForgotPwModal
        isOpen={isOpen && !showSuccessModal && !showVerificationModal && !showPasswordResetModal}
        onClose={handleClose}
        className={`transition-all duration-500 ease-in-out ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {content}
      </ForgotPwModal>

      <PasswordResetSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        onContinue={handleSuccessModalContinue}
      />

      <VerificationCodeModal
        isOpen={showVerificationModal && isOpen}
        onClose={handleCloseVerificationModal}
        onVerify={handleVerifyCode}
        email={email}
        onResend={handleResendCode}
        isVerifying={isVerifying}
        isResending={isResending}
        onSuccess={handleVerificationSuccess}
      />

      <PasswordResetModal
        isOpen={showPasswordResetModal && isOpen}
        onClose={handleClose}
        onSuccess={handlePasswordResetSuccess}
        resetToken={resetToken || ''}
      />
    </>
  );
};

export default ForgotPasswordModal;
