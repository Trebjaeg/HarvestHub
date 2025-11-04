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
      
      if (!res.ok) {
        // Show error below the input field if user not found
        if (res.status === 404) {
          setEmailError('No account found with this email address.');
        } else {
          setEmailError(data.message || 'Failed to request reset');
        }
        return;
      }
      
      // Only show verification modal if user exists and email was sent
      setServerMessage(data.message || 'Password reset code sent to your email.');
      setShowVerificationModal(true);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
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
    setShowSuccessModal(false);
    setShowVerificationModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    handleClose();
  };

  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid verification code');
      
      // Store the JWT token and proceed to password reset
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setShowVerificationModal(false);
        setShowPasswordResetModal(true);
      } else {
        throw new Error('No reset token received');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Verification failed');
    } finally {
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
    <>
      {/* Header with icon and close button */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-start gap-3">
          {/* Email icon */}
          <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M22 7.535v9.465a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-9.465l9.445 6.297l.116 .066a1 1 0 0 0 .878 0l.116 -.066l9.445 -6.297z" />
              <path d="M19 4c1.08 0 2.027 .57 2.555 1.427l-9.555 6.37l-9.555 -6.37a2.999 2.999 0 0 1 2.354 -1.42l.201 -.007h14z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Reset Password
            </h2>
            <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Enter your email address
            </p>
          </div>
        </div>
        {/* Close button */}
        <button
          onClick={handleClose}
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
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="text-left">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="ex: myname@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-700 text-sm bg-gray-50 font-normal placeholder:text-gray-400"
              disabled={loading}
            />
            {emailError && (
              <div className="mt-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-500">{emailError}</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </div>
        </form>

        {/* Register link */}
        <p className="text-sm text-gray-600 mt-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Don't have an account yet?{' '}
          <button 
            onClick={handleClose}
            className="text-green-600 hover:text-green-700 font-medium underline"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Create account
          </button>
        </p>
      </div>
    </>
  );

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


