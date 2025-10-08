"use client";

import { FC, useState, useEffect } from "react";
import SuccessModal from "@/components/ui/SuccessModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { validatePasswordStrength, getPasswordStrengthColor } from "@/lib/password-strength";
import TrmsNConAndPP from "@/components/ui/trmsnconandpp";
import { TermsContent, PrivacyContent } from "@/components/legal/LegalContent";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "@/lib/auth-validation";
import { useTranslatableErrors } from "@/hooks/useTranslatableErrors";

const AuthFormInput: FC = () => {
  const { t } = useTranslation();
  const { 
    state, 
    setEmail, 
    setPassword, 
    setConfirmPassword, 
    setFirstName, 
    setLastName,
    setAcceptTerms,
    setAcceptPrivacy,
    setNextStep,
    setError,
    dispatch
  } = useAuth();

  // Use translatable errors for smooth translation
  const {
    setError: setFieldError,
    getError: getFieldError,
    clearError: clearFieldError,
    clearAllErrors: clearAllFieldErrors,
    hasError: hasFieldError
  } = useTranslatableErrors();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const passwordStrength = state.password ? validatePasswordStrength(state.password) : null;
  // Login pane state: first ask email, then show password (single button switches label)
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);

  // Animated loading indicator SVG (bigger, white bouncing dots)
  const LoadingDots = () => (
    <svg
      width="300"
      height="100"
      viewBox="0 0 120 30"
      className="size-12"
      role="img"
      aria-label="loading"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="30" cy="15" r="10" fill="#ffffff">
        <animate
          attributeName="cy"
          from="15"
          to="15"
          dur="0.6s"
          begin="0s"
          repeatCount="indefinite"
          values="15;5;15"
          keyTimes="0;0.5;1"
        />
      </circle>
      <circle cx="60" cy="15" r="10" fill="#ffffff">
        <animate
          attributeName="cy"
          from="15"
          to="15"
          dur="0.6s"
          begin="0.2s"
          repeatCount="indefinite"
          values="15;5;15"
          keyTimes="0;0.5;1"
        />
      </circle>
      <circle cx="90" cy="15" r="10" fill="#ffffff">
        <animate
          attributeName="cy"
          from="15"
          to="15"
          dur="0.6s"
          begin="0.4s"
          repeatCount="indefinite"
          values="15;5;15"
          keyTimes="0;0.5;1"
        />
      </circle>
    </svg>
  );

  // Function to validate name input (only letters, spaces, and common name characters) - SECURITY IMPROVEMENT
  const handleNameInput = (value: string, fieldType: 'firstName' | 'lastName') => {
    const sanitizedValue = AuthValidator.sanitizeNameInput(value);
    if (fieldType === 'firstName') {
      setFirstName(sanitizedValue);
    } else {
      setLastName(sanitizedValue);
    }
  };


  // Unified registration handler
  const handleRegisterUser = async () => {
    // Clear all registration errors first
    clearFieldError('firstName');
    clearFieldError('lastName');
    clearFieldError('password');
    clearFieldError('confirmPassword');
    
    // Validate fields using the new translatable error system
    let hasErrors = false;
    
    if (!state.firstName.trim()) {
      setFieldError('firstName', 'auth.validation.firstNameRequired');
      hasErrors = true;
    }
    if (!state.lastName.trim()) {
      setFieldError('lastName', 'auth.validation.lastNameRequired');
      hasErrors = true;
    }
    if (!state.password) {
      setFieldError('password', 'auth.validation.passwordRequired');
      hasErrors = true;
    }
    if (state.password !== state.confirmPassword) {
      setFieldError('confirmPassword', 'auth.validation.passwordMismatch');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }

    // If terms/privacy not accepted, open modals and wait
    if (!state.acceptTerms) {
      setShowTermsModal(true);
      return;
    }
    if (!state.acceptPrivacy) {
      setShowPrivacyModal(true);
      return;
    }

    // If all accepted, call API
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${state.firstName.trim()} ${state.lastName.trim()}`.trim(),
          email: state.email,
          password: state.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      dispatch({ type: 'RESET_FORM' });
      setShowSuccessModal(true);
      // After showing success, reset to login pane (show email+password, button = Login)
      setTimeout(() => {
        setShowSuccessModal(false);
        dispatch({ type: 'RESET_TO_EMAIL_STEP' });
        clearAllFieldErrors(); // Clear translatable errors on success
        // After creating account, go back to login with password field visible
        setStep('password');
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('auth.error.generic'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };


  // When user accepts terms modal, set state and continue registration
  const handleAcceptTerms = () => {
    setAcceptTerms(true);
    setShowTermsModal(false);
    // If privacy not accepted, open privacy modal next
    if (!state.acceptPrivacy) {
      setShowPrivacyModal(true);
    } else {
      // Both accepted, continue registration
      handleRegisterUser();
    }
  };

  // When user accepts privacy modal, set state and continue registration
  const handleAcceptPrivacy = () => {
    setAcceptPrivacy(true);
    setShowPrivacyModal(false);
    // Both accepted, continue registration
    handleRegisterUser();
  };

  const resetLegalModals = () => {
    dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: false });
  };
  
  // Step 2: Registration form - RESTORED ORIGINAL STRUCTURE
  if (state.nextStep) {
    return (
      <>
        <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
        <div className="space-y-6">
        {/* Top Back Control */}
        <button
          type="button"
          className="inline-flex items-center text-green-700 hover:text-green-800 focus:outline-none"
          onClick={() => {
            dispatch({ type: 'RESET_TO_EMAIL_STEP' });
            dispatch({ type: 'CLEAR_ALL_ERRORS' });
            clearAllFieldErrors(); // Clear translatable errors too
          }}
          aria-label={t('auth.back') || 'Back'}
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow flex items-center justify-center">
            <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
            </svg>
          </span>
          <span className="ml-2 font-medium">{t('auth.back') || 'Back'}</span>
        </button>
        {/* Name Section */}
        <div>
          <Label className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.name')}
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                id="firstName"
                type="text"
                placeholder={t('auth.firstName')}
                value={state.firstName}
                onChange={(e) => handleNameInput(e.target.value, 'firstName')}
                className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                  hasFieldError('firstName')
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-600"
                }`}
              />
              {getFieldError('firstName') && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{getFieldError('firstName')}</p>
                </div>
              )}
            </div>
            <div>
              <Input
                id="lastName"
                type="text"
                placeholder={t('auth.lastName')}
                value={state.lastName}
                onChange={(e) => handleNameInput(e.target.value, 'lastName')}
                className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                  hasFieldError('lastName')
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-600"
                }`}
              />
              {getFieldError('lastName') && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{getFieldError('lastName')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Section - RESTORED: Read-only email display */}
        <div>
          <Label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="text"
            value={state.email}
            readOnly
            className="w-full h-12 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 px-4 py-3 text-base"
          />
        </div>

        {/* Password Section - RESTORED ORIGINAL + SECURITY IMPROVEMENTS */}
        <div>
          <Label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={state.password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={`w-full h-12 rounded-lg border px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                hasFieldError('password')
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                // Visible -> show open eye icon (tap to hide)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                // Hidden -> show slashed eye icon (tap to show)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          {getFieldError('password') && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{getFieldError('password')}</p>
            </div>
          )}
          
          {/* Password Strength Indicator - SECURITY FEATURE */}
          {state.password && passwordStrength && (
            <div className="mt-2">
              {/* Strength Bar */}
              <div className="flex space-x-1 mb-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= passwordStrength.score
                        ? passwordStrength.score <= 1
                          ? 'bg-red-500'
                          : passwordStrength.score <= 2
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              {/* Strength Label */}
              <p className={`text-xs ${getPasswordStrengthColor(passwordStrength.score)}`}>
                {passwordStrength.score <= 1 && t('auth.validation.passwordWeak')}
                {passwordStrength.score === 2 && t('auth.validation.passwordMedium')}
                {passwordStrength.score >= 3 && t('auth.validation.passwordStrong')}
              </p>
              
              {/* Requirements List */}
              <div className="mt-1 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className={state.password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                    {state.password.length >= 8 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    )}
                  </span>
                  <span>{t('auth.validation.passwordRequirement8Chars')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(state.password) ? 'text-green-600' : 'text-red-600'}>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(state.password) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    )}
                  </span>
                  <span>{t('auth.validation.passwordRequirementSymbols')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password - RESTORED ORIGINAL */}
          <div className="mt-4 relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={state.confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={`w-full h-12 rounded-lg border px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                hasFieldError('confirmPassword')
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-green-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirmPassword ? (
                // Visible -> show open eye icon
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                // Hidden -> show slashed eye icon
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          {getFieldError('confirmPassword') && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{getFieldError('confirmPassword')}</p>
            </div>
          )}
        </div>

        {/* Action Buttons - NO CHECKBOXES, JUST BUTTONS */}
        <div className="space-y-4">
          <Button
            type="button"
            onClick={() => {
              // Always call handleRegisterUser directly
              handleRegisterUser();
            }}
            disabled={state.loading}
            variant="default"
            className="w-full h-12 text-white font-semibold text-base rounded-lg disabled:opacity-50"
          >
            {state.loading ? (
              <span className="flex items-center justify-center w-full">
                <LoadingDots />
              </span>
            ) : (
              t('auth.createAccount')
            )}
          </Button>
        </div>

        {/* Modals - RESTORED ORIGINAL */}
        <TrmsNConAndPP
          isOpen={showTermsModal}
          onClose={() => {
            setShowTermsModal(false);
            resetLegalModals();
          }}
          title={t('modal.termsTitle')}
          acceptText={t('modal.acceptTerms')}
          onAccept={handleAcceptTerms}
        >
          <TermsContent />
        </TrmsNConAndPP>

        <TrmsNConAndPP
          isOpen={showPrivacyModal}
          onClose={() => {
            setShowPrivacyModal(false);
            resetLegalModals();
          }}
          title={t('modal.privacyTitle')}
          acceptText={t('modal.acceptPrivacy')}
          onAccept={handleAcceptPrivacy}
        >
          <PrivacyContent />
        </TrmsNConAndPP>

        {state.error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{state.error}</p>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  const handleButtonClick = async () => {
    // Clear field errors on new attempt
    clearFieldError('email');
    clearFieldError('loginPassword');
    if (step === 'email') {
      if (!state.email) {
        setFieldError('email', 'auth.validation.emailRequired');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) {
        setFieldError('email', 'auth.validation.emailInvalid');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: state.email })
        });
        const data = await res.json();
        if (res.status === 200 && data.exists) {
          // Known user → show password field and change button to Login
          setStep('password');
          clearFieldError('email');
        } else if (res.status === 200 && !data.exists) {
          // Unknown email → go to registration form
          dispatch({ type: 'SET_IS_NEW_USER', payload: true });
          dispatch({ type: 'SET_NEXT_STEP', payload: true });
        } else {
          // For API error messages, we might not have translation keys, so store as is
          setFieldError('email', data.message || 'auth.validation.emailCheckError');
        }
      } catch (err) {
        setFieldError('email', 'auth.validation.emailCheckError');
      } finally {
        setLoading(false);
      }
    } else if (step === 'password') {
      // Perform login and redirect to home
      if (!state.password) {
        setFieldError('loginPassword', 'auth.validation.passwordRequired');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: state.email, password: state.password })
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            // Use translated message for wrong password
            setFieldError('loginPassword', 'auth.validation.wrongPassword');
            return;
          }
          setFieldError('loginPassword', 'auth.validation.loginFailed');
          return;
        }
        // Store token for fallback authentication (especially for mobile/IP access)
        if (data.token) {
          try { 
            localStorage.setItem('hh_token', data.token);
            localStorage.setItem('auth-token', data.token); // Also store with cookie name for consistency
          } catch {}
        }
        window.location.href = '/home';
      } catch (err: any) {
        setFieldError('loginPassword', 'auth.validation.loginFailed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {step === 'password' && (
        <button
          type="button"
          className="mb-4 inline-flex items-center text-green-700 hover:text-green-800 focus:outline-none"
          onClick={() => {
            // Allow user to edit email again
            setStep('email');
            setPassword('');
            clearFieldError('email');
            clearFieldError('loginPassword');
            dispatch({ type: 'CLEAR_ALL_ERRORS' });
          }}
          aria-label={t('auth.back') || 'Back'}
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow flex items-center justify-center">
            <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
            </svg>
          </span>
          <span className="ml-2 font-medium">{t('auth.back') || 'Back'}</span>
        </button>
      )}
      <Label
        htmlFor="initialEmail"
        className="block text-sm font-semibold text-gray-800 mb-3"
      >
        {t('auth.email')}
      </Label>
      <Input
        id="initialEmail"
        type="text"
        placeholder="ex: myname@example.com"
        value={state.email}
        onChange={(e) => setEmail(e.target.value)}
        className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
          step === 'email' && hasFieldError('email')
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-green-600"
        }`}
        disabled={step === 'password'}
      />
      {step === 'email' && getFieldError('email') && (
        <div className="mt-2 bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-500">{getFieldError('email')}</p>
          </div>
        </div>
      )}
      {step === 'password' && (
        <div className="mt-4">
          <Label htmlFor="loginPassword" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="loginPassword"
              type={showLoginPassword ? "text" : "password"}
              placeholder={t('auth.password')}
              value={state.password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full h-12 rounded-lg border px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                hasFieldError('loginPassword') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showLoginPassword ? (
                // Visible -> open eye icon
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                // Hidden -> slashed eye icon
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          {getFieldError('loginPassword') && (
            <div className="mt-2 bg-red-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-500">{getFieldError('loginPassword')}</p>
              </div>
            </div>
          )}
        </div>
      )}
      <Button
        className="mt-4 w-full h-12 font-semibold text-base rounded-lg"
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center w-full">
            <LoadingDots />
          </span>
        ) : step === 'email' ? (
          t('auth.proceed') || 'Proceed'
        ) : (
          t('auth.loginHere') || 'Login'
        )}
      </Button>
      {/* Bottom generic error removed for login; field-specific errors shown inline above */}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;