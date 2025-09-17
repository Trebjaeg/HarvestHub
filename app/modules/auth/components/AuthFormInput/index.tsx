"use client";

import { FC, useState, useEffect } from "react";
import { AuthFormProps } from "../AuthForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { validatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthBg } from "@/lib/password-strength";
import Link from "next/link";
import TrmsNConAndPP from "@/components/ui/trmsnconandpp";
import { TermsContent, PrivacyContent } from "@/components/legal/LegalContent";

const AuthFormInput: FC<AuthFormProps> = ({
  nextStep,
  password,
  setPassword,
  email,
  setEmail,
  error,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  confirmPassword,
  setConfirmPassword,
  acceptTerms,
  setAcceptTerms,
  acceptPrivacy,
  setAcceptPrivacy,
  acceptMarketing,
  setAcceptMarketing,
  firstNameError,
  lastNameError,
  passwordError,
  confirmPasswordError,
  termsError,
  privacyError,
  showLegalModals,
  resetLegalModals,
}) => {
  const { t } = useTranslation();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = password ? validatePasswordStrength(password) : null;

  // Function to validate name input (only letters, spaces, and common name characters)
  const handleNameInput = (value: string, setter: ((name: string) => void) | undefined) => {
    // Allow only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']*$/;
    if (nameRegex.test(value)) {
      setter?.(value);
    }
  };

  // Trigger modals when parent requests it
  useEffect(() => {
    if (showLegalModals) {
      setShowTermsModal(true);
    }
  }, [showLegalModals]);
  
  // Step 2: Registration form
  if (nextStep) {
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
                value={firstName}
                onChange={(e) => handleNameInput(e.target.value, setFirstName)}
                className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                  firstNameError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-600"
                }`}
              />
              {firstNameError && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{firstNameError}</p>
                </div>
              )}
            </div>
            <div>
              <Input
                id="lastName"
                type="text"
                placeholder={t('auth.lastName')}
                value={lastName}
                onChange={(e) => handleNameInput(e.target.value, setLastName)}
                className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                  lastNameError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-green-600"
                }`}
              />
              {lastNameError && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{lastNameError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div>
          <Label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full h-12 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 px-4 py-3 text-base"
          />
        </div>

        {/* Password Section */}
        <div>
          <Label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword?.(e.target.value)}
              autoComplete="new-password"
              className={`w-full h-12 rounded-lg border px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                passwordError
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
          {passwordError && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{passwordError}</p>
            </div>
          )}
          
          {/* Password Strength Indicator */}
          {password && passwordStrength && (
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
                  <span className={password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                    {password.length >= 8 ? (
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
                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? (
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
        </div>

        {/* Confirm Password Section */}
        <div>
          <Label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.confirmPassword')}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword?.(e.target.value)}
              autoComplete="new-password"
              className={`w-full h-12 rounded-lg border px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
                confirmPasswordError
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
          {confirmPasswordError && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{confirmPasswordError}</p>
            </div>
          )}
        </div>
        {/* Modals */}
        <TrmsNConAndPP
          isOpen={showTermsModal}
          onClose={() => {
            setShowTermsModal(false);
            resetLegalModals?.();
          }}
          title={t('modal.termsTitle')}
          acceptText={t('modal.acceptTerms')}
          onAccept={() => {
            setAcceptTerms?.(true);
            setShowTermsModal(false);
            // After accepting terms, show privacy modal
            setShowPrivacyModal(true);
          }}
        >
          <TermsContent />
        </TrmsNConAndPP>

        <TrmsNConAndPP
          isOpen={showPrivacyModal}
          onClose={() => {
            setShowPrivacyModal(false);
            resetLegalModals?.();
          }}
          title={t('modal.privacyTitle')}
          acceptText={t('modal.acceptPrivacy')}
          onAccept={() => {
            setAcceptPrivacy?.(true);
            setShowPrivacyModal(false);
            resetLegalModals?.();
            // Both accepted, user can now create account
          }}
        >
          <PrivacyContent />
        </TrmsNConAndPP>

        {error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{error}</p>
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
        value={email}
        onChange={(e) => setEmail?.(e.target.value)}
        className={`w-full h-12 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:border-transparent ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-green-600"
        }`}
      />
      {error && (
        <div className="mt-2 bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;
