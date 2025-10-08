import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ForgotPwModal from '../../../../../components/ui/forgotpwmodal';
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
      setIsSubmitted(true);
    } catch (err: any) {
      setServerMessage(err.message || 'Failed to request reset');
      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setIsSubmitted(false);
    onClose();
  };

  const content = isSubmitted ? (
    <div className="p-6">
      {/* Success State */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-sm text-green-700 font-medium">
          <p>{serverMessage || 'Password reset link sent to your email!'}</p>
        </div>
      </div>
    </div>
  ) : (
    <div className="p-6">
      {/* Header with separator */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {t('auth.resetPassword')}
        </h2>
        {/* Separator line */}
        <hr className="border-gray-200" />
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-6">
        {t('auth.resetPasswordInstructions')}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Input */}
        <div className="mb-6">
          <Label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.email')}
          </Label>
          <Input
            id="reset-email"
            type="text"
            value={email}
            onChange={handleEmailChange}
            className={`w-full px-3 py-3 rounded-md focus:ring-2 focus:ring-green-500 transition-colors ${
              emailError 
                ? 'border-red-500 border-2 focus:border-red-500' 
                : 'border border-gray-300 focus:border-green-500'
            }`}
            placeholder={t('auth.email')}
            autoComplete="email"
          />
          {emailError && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{emailError}</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md transition-colors"
            disabled={loading}
          >
            {loading ? t('auth.loading') : t('auth.sendResetLink')}
          </Button>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('modal.cancel')}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <ForgotPwModal
      isOpen={isOpen}
      onClose={handleClose}
    >
      {content}
    </ForgotPwModal>
  );
};

export default ForgotPasswordModal;
