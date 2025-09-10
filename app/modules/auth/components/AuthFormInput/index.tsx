"use client";

import { FC, useState, useEffect } from "react";
import { AuthFormProps } from "../AuthForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
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
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <span className="mr-1">*</span> {firstNameError}
                </p>
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
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <span className="mr-1">*</span> {lastNameError}
                </p>
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
          {passwordError && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">*</span> {passwordError}
            </p>
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
          {confirmPasswordError && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">*</span> {confirmPasswordError}
            </p>
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
          <p className="text-red-600 text-sm flex items-center bg-red-50 p-3 rounded-lg">
            <span className="mr-2">⚠️</span> {error}
          </p>
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
        <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-3 rounded-lg">
          <span className="mr-2">*</span> {error}
        </p>
      )}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;
