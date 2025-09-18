"use client";

import { FC, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { validatePasswordStrength, getPasswordStrengthColor } from "@/lib/password-strength";
import TrmsNConAndPP from "@/components/ui/trmsnconandpp";
import { TermsContent, PrivacyContent } from "@/components/legal/LegalContent";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "@/lib/auth-validation";

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

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = state.password ? validatePasswordStrength(state.password) : null;

  // Function to validate name input (only letters, spaces, and common name characters) - SECURITY IMPROVEMENT
  const handleNameInput = (value: string, fieldType: 'firstName' | 'lastName') => {
    const sanitizedValue = AuthValidator.sanitizeNameInput(value);
    if (fieldType === 'firstName') {
      setFirstName(sanitizedValue);
    } else {
      setLastName(sanitizedValue);
    }
  };

  // Handle user registration - TRIGGER MODALS WHEN CLICKING CREATE ACCOUNT
  const handleRegisterUser = async () => {
    // Basic validation first
    if (!state.firstName.trim()) {
      dispatch({ type: 'SET_FIRST_NAME_ERROR', payload: t('auth.validation.firstNameRequired') });
      return;
    }
    if (!state.lastName.trim()) {
      dispatch({ type: 'SET_LAST_NAME_ERROR', payload: t('auth.validation.lastNameRequired') });
      return;
    }
    if (!state.password) {
      dispatch({ type: 'SET_PASSWORD_ERROR', payload: t('auth.validation.passwordRequired') });
      return;
    }
    if (state.password !== state.confirmPassword) {
      dispatch({ type: 'SET_CONFIRM_PASSWORD_ERROR', payload: t('auth.validation.passwordMismatch') });
      return;
    }

    // Clear any errors
    dispatch({ type: 'CLEAR_ALL_ERRORS' });

    // If terms and privacy already accepted, complete registration
    if (state.acceptTerms && state.acceptPrivacy) {
      // Here you would make the API call
    } else {
      // Trigger terms/privacy modal flow
      dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: true });
    }
  };

  // Trigger modals when parent requests it
  useEffect(() => {
    if (state.showLegalModals) {
      setShowTermsModal(true);
    }
  }, [state.showLegalModals]);

  // Complete registration when both terms and privacy are accepted
  useEffect(() => {
    if (state.acceptTerms && state.acceptPrivacy && state.showLegalModals) {
      // Both accepted, complete registration
      
      // Reset modal state
      dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: false });
      
      // Here you would make the API call and show success message
    }
  }, [state.acceptTerms, state.acceptPrivacy, state.showLegalModals, state.email, state.password, state.firstName, state.lastName, dispatch]);

  const resetLegalModals = () => {
    dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: false });
  };
  
  // Step 2: Registration form - RESTORED ORIGINAL STRUCTURE
  if (state.nextStep) {
    return (
      <div className="space-y-6">
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
                  state.firstNameError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-600"
                }`}
              />
              {state.firstNameError && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{state.firstNameError}</p>
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
                  state.lastNameError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-600"
                }`}
              />
              {state.lastNameError && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{state.lastNameError}</p>
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
            type="email"
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
                state.passwordError
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          {state.passwordError && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{state.passwordError}</p>
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
                state.confirmPasswordError
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          {state.confirmPasswordError && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{state.confirmPasswordError}</p>
            </div>
          )}
        </div>

        {/* Action Buttons - NO CHECKBOXES, JUST BUTTONS */}
        <div className="space-y-4">
          <Button
            onClick={handleRegisterUser}
            disabled={state.loading}
            variant="default"
            className="w-full h-12 text-white font-semibold text-base rounded-lg disabled:opacity-50"
          >
            {state.loading ? t('auth.registering') : t('auth.createAccount')}
          </Button>
          
          {/* BACK BUTTON */}
          <Button
            onClick={() => dispatch({ type: 'RESET_TO_EMAIL_STEP' })}
            variant="outline"
            className="w-full h-12 border-[#614124] text-[#614124] hover:bg-[#614124]/10 font-semibold text-base rounded-lg"
          >
            {t('auth.back')}
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
          onAccept={() => {
            setAcceptTerms(true);
            setShowTermsModal(false);
            setShowPrivacyModal(true);
          }}
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
          onAccept={() => {
            setAcceptPrivacy(true);
            setShowPrivacyModal(false);
            resetLegalModals();
          }}
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
    );
  }

  // Step 1: Email input
  return (
    <div>
      <Label
        htmlFor="initialEmail"
        className="block text-sm font-semibold text-gray-800 mb-3"
      >
        {t('auth.email')}
      </Label>
      <Input
        id="initialEmail"
        type="email"
        placeholder="ex: myname@example.com"
        value={state.email}
        onChange={(e) => setEmail(e.target.value)}
        className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
          state.error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-green-600"
        }`}
      />
      {state.error && (
        <div className="mt-2 bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-500">{state.error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;