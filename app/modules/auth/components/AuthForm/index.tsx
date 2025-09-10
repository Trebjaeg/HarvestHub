"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { validateEmail } from "@/lib/validate-email";
import { toast } from "sonner";
import AuthFormInput from "../AuthFormInput";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ForgotPasswordModal from "../ForgotPasswordModal";

export interface AuthFormProps {
  email?: string;
  setEmail?: (email: string) => void;
  error?: string;
  setError?: (error: string) => void;
  nextStep?: boolean;
  setNextStep?: (nextStep: boolean) => void;
  password?: string;
  setPassword?: (password: string) => void;
  handleSubmit?: (e: React.FormEvent) => void;
  isNewUser?: boolean;
  confirmPassword?: string;
  setConfirmPassword?: (password: string) => void;
  fullName?: string;
  setFullName?: (name: string) => void;
  firstName?: string;
  setFirstName?: (name: string) => void;
  lastName?: string;
  setLastName?: (name: string) => void;
  acceptTerms?: boolean;
  setAcceptTerms?: (accept: boolean) => void;
  acceptPrivacy?: boolean;
  setAcceptPrivacy?: (accept: boolean) => void;
  acceptMarketing?: boolean;
  setAcceptMarketing?: (accept: boolean) => void;
  // Error states
  firstNameError?: string;
  lastNameError?: string;
  passwordError?: string;
  confirmPasswordError?: string;
  termsError?: string;
  privacyError?: string;
  // Validation function
  validateCreateAccount?: () => boolean;
  // Legal modals trigger
  showLegalModals?: boolean;
  resetLegalModals?: () => void;
}

const AuthForm: FC<AuthFormProps> = ({
  email,
  error,
  nextStep,
  password,
  setEmail,
  setPassword,
  setError,
  handleSubmit,
  setNextStep,
  confirmPassword,
  setConfirmPassword,
  fullName,
  setFullName,
  firstName,
  setFirstName,
  lastName,
  setLastName,
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
  validateCreateAccount,
}) => {
  const { t } = useTranslation();
  const [showLegalModals, setShowLegalModals] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  const resetLegalModals = () => {
    setShowLegalModals(false);
  };
  
  const emailValid = useMemo(() => {
    if (email === "") return true;
    return !validateEmail(email || "");
  }, [email]);

  useEffect(() => {
    if (emailValid && email !== "") setError?.(t('auth.errors.emailCorrect'));
    if (!emailValid) setError?.("");
  }, [emailValid, email, t]);

  // Handle account creation when both legal documents are accepted
  useEffect(() => {
    if (showLegalModals && acceptTerms && acceptPrivacy) {
      setShowLegalModals(false);
      toast.success(t('auth.success.accountCreated'));
      // Here you would normally submit the form to your backend
    }
  }, [acceptTerms, acceptPrivacy, showLegalModals, t]);

  const handleCreateAccountClick = () => {
    if (nextStep) {
      // Check if basic fields are valid first
      const basicFieldsValid = validateCreateAccount?.() || false;
      
      if (basicFieldsValid) {
        // If both terms and privacy are already accepted, proceed with account creation
        if (acceptTerms && acceptPrivacy) {
          toast.success(t('auth.success.accountCreated'));
          // Here you would normally submit the form to your backend
        } else {
          // Show legal modals flow
          setShowLegalModals(true);
        }
      }
      // If basic fields are not valid, validateCreateAccount will show errors
    } else {
      // On proceed step, go to next step
      setNextStep?.(!emailValid);
      if (!emailValid) toast.success(t('auth.success.emailPassed'));
    }
  };

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 relative overflow-auto">
      <LanguageSwitcher />
      <div className="w-full max-w-md shadow-xl rounded-2xl bg-white p-8 mx-auto border border-gray-100">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Image
              src="/images/harvesthub.png"
              alt="Harvest Hub"
              width={32}
              height={32}
            />
            <h1 className="text-lg font-semibold text-green-700 ml-3">
              Harvest Hub
            </h1>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            {nextStep ? t('modal.registrationTitle') : t('auth.title')}
          </h2>
          <p className="text-gray-600 text-sm">
            {nextStep ? t('modal.registrationSubtitle') : t('auth.subtitle')}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            handleSubmit?.(e);
            console.log("test");
          }}
          className="space-y-6"
        >
          <AuthFormInput
            email={email}
            setEmail={setEmail}
            error={error}
            nextStep={nextStep}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            fullName={fullName}
            setFullName={setFullName}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            acceptTerms={acceptTerms}
            setAcceptTerms={setAcceptTerms}
            acceptPrivacy={acceptPrivacy}
            setAcceptPrivacy={setAcceptPrivacy}
            acceptMarketing={acceptMarketing}
            setAcceptMarketing={setAcceptMarketing}
            firstNameError={firstNameError}
            lastNameError={lastNameError}
            passwordError={passwordError}
            confirmPasswordError={confirmPasswordError}
            termsError={termsError}
            privacyError={privacyError}
            showLegalModals={showLegalModals}
            resetLegalModals={resetLegalModals}
          />
          
          <Button
            disabled={emailValid}
            variant={"default"}
            type="button"
            onClick={handleCreateAccountClick}
            className="w-full text-white font-semibold py-3 text-base rounded-lg transition cursor-pointer"
          >
            {nextStep ? t('auth.createAccount') : t('auth.proceed')}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {nextStep ? (
            <>
              {t('auth.alreadyHaveAccount')}{" "}
              <button
                type="button"
                onClick={() => setNextStep?.(false)}
                className="text-green-700 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {t('auth.loginHere')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-green-700 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {t('auth.forgotPassword')}
            </button>
          )}
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
};

AuthForm.displayName = "AuthForm";
export default AuthForm;
