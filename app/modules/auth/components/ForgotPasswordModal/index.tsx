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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError(t('auth.validation.emailInvalid'));
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setEmailError(t('auth.validation.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t('auth.validation.emailInvalid'));
      return;
    }

    // Here you would typically send the reset email
    // For now, we'll just show a success state
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    setIsSubmitted(false);
    onClose();
  };

  const content = isSubmitted ? (
    <div className="text-center px-6 pb-6">
      <div className="mb-4">
        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Email Sent!
        </h3>
        <p className="text-gray-600">
          We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
        </p>
      </div>
      <Button
        onClick={handleClose}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        Done
      </Button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="px-6 pb-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('auth.resetPassword')}
        </h2>
        <p className="text-gray-600 text-sm">
          {t('auth.resetPasswordInstructions')}
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.email')}
        </Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          placeholder="Enter your email address"
        />
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          onClick={handleClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t('modal.cancel')}
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t('auth.sendResetLink')}
        </Button>
      </div>
    </form>
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
