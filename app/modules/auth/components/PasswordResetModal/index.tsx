'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslatableErrors } from '../../../../../hooks/useTranslatableErrors';
import { validatePasswordStrength, getPasswordStrengthColor } from '../../../../../lib/password-strength';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resetToken: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  resetToken,
}) => {
  const { t } = useTranslation();
  const { setError: setFieldError, getError: getFieldError, clearError: clearFieldError } = useTranslatableErrors();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength validation (same as registration)
  const passwordStrength = password ? validatePasswordStrength(password) : null;

  // Clear errors when modal opens - COMMENTED OUT TO PREVENT INPUT RESET
  /*React.useEffect(() => {
    if (isOpen) {
      clearFieldError('password');
      clearFieldError('confirmPassword');
      clearFieldError('general');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, clearFieldError]);*/

  const handleSubmit = async () => {
    // Clear previous errors
    clearFieldError('password');
    clearFieldError('confirmPassword');
    clearFieldError('general');

    // Check if we have a reset token
    if (!resetToken) {
      setFieldError('general', 'Reset session expired. Please request a new password reset.');
      return;
    }

    // Validate password using same rules as registration
    if (!passwordStrength || !passwordStrength.isValid) {
      if (passwordStrength && passwordStrength.feedback.length > 0) {
        setFieldError('password', passwordStrength.feedback[0]); // Show first validation error
      } else {
        setFieldError('password', 'auth.validation.passwordRequired');
      }
      return;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'auth.validation.passwordsDoNotMatch');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting password reset with token:', resetToken ? 'Present' : 'Missing');
      
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resetToken, 
          password: password 
        })
      });

      const data = await res.json();
      console.log('Password reset response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      console.log('Password reset successful');
      onSuccess();
    } catch (err: any) {
      console.error('Password reset error:', err);
      setFieldError('general', err.message || 'auth.errors.passwordResetFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center border-b border-border/50">
          {/* Modern Lock Icon with Green branding */}
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg ring-1 ring-green-500/20">
            <div className="relative">
              {/* Lock body */}
              <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C9.79 2 8 3.79 8 6v2H7c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-1V6c0-2.21-1.79-4-4-4zm0 2c1.1 0 2 .9 2 2v2h-4V6c0-1.1.9-2 2-2z"/>
              </svg>
              {/* Key indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-sm border border-white"></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t('auth.createNewPassword')}
          </h2>
          
          <p className="text-muted-foreground text-sm">
            {t('auth.createNewPasswordSubtitle')}
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8 space-y-6">
          {/* General Error */}
          {getFieldError('general') && (
            <div className="flex items-center space-x-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-destructive font-medium">{getFieldError('general')}</p>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-foreground">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (getFieldError('password')) {
                    clearFieldError('password');
                  }
                }}
                className={`w-full px-4 py-3 pr-12 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  getFieldError('password') ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input hover:border-green-400'
                }`}
                placeholder={t('auth.enterNewPassword')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {getFieldError('password') && (
              <p className="text-sm text-destructive mt-1.5">{getFieldError('password')}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
              {t('auth.confirmNewPassword')}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (getFieldError('confirmPassword')) {
                    clearFieldError('confirmPassword');
                  }
                }}
                className={`w-full px-4 py-3 pr-12 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                  getFieldError('confirmPassword') ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input hover:border-green-400'
                }`}
                placeholder={t('auth.confirmNewPassword')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {getFieldError('confirmPassword') && (
              <p className="text-sm text-destructive mt-1.5">{getFieldError('confirmPassword')}</p>
            )}
          </div>

          {/* Password Requirements & Strength */}
          <div className="text-sm space-y-3">
            <p className="text-muted-foreground font-medium">{t('auth.passwordRequirements')}:</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                  {password.length >= 8 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                </span>
                <span className={password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                  {t('auth.validation.passwordRequirement8Chars')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                </span>
                <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}>
                  {t('auth.validation.passwordRequirementSymbols')}
                </span>
              </div>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordStrength && password.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}>
                    {passwordStrength.score === 0 && t('auth.validation.passwordWeak')}
                    {passwordStrength.score === 1 && t('auth.validation.passwordWeak')}
                    {passwordStrength.score === 2 && t('auth.validation.passwordMedium')}
                    {passwordStrength.score >= 3 && t('auth.validation.passwordStrong')}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 1 ? 'bg-destructive' :
                      passwordStrength.score === 2 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.max(20, (passwordStrength.score / 4) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-border/50">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-input bg-background text-muted-foreground font-semibold rounded-lg hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {t('auth.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !password || !confirmPassword}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('auth.updatingPassword')}
                </div>
              ) : (
                t('auth.updatePassword')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;