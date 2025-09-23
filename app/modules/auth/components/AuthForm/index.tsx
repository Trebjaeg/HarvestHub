"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { validateEmail } from "@/lib/validate-email";
import { toast } from "sonner";
import AuthFormInput from "../AuthFormInput";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ForgotPasswordModal from "../ForgotPasswordModal";
import { useAuth } from "../../context/AuthContext";
import { AuthValidator } from "@/lib/auth-validation";

export interface AuthFormProps {
  handleSubmit?: (e: React.FormEvent) => void;
  validateCreateAccount?: () => boolean;
}

const AuthForm: FC<AuthFormProps> = ({
  handleSubmit,
  validateCreateAccount,
}) => {
  const { t } = useTranslation();
  const { state, setError, dispatch } = useAuth();
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const isEmailInvalid = useMemo(() => {
    if (state.email === "") return false; // Empty email is not invalid, just empty
    return !validateEmail(state.email);
  }, [state.email]);

  const isEmailValid = useMemo(() => {
    if (state.email === "") return false; // Empty email is not valid
    return validateEmail(state.email);
  }, [state.email]);

  // Remove infinite update useEffect. Only set error on blur or submit, not on every render.

  // Handle account creation when both legal documents are accepted
  useEffect(() => {
    if (state.showLegalModals && state.acceptTerms && state.acceptPrivacy) {
      dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: false });
      toast.success(t('auth.success.accountCreated'));
      // Here you would normally submit the form to your backend
    }
  }, [state.acceptTerms, state.acceptPrivacy, state.showLegalModals, t, dispatch]);

  const handleCreateAccountClick = () => {
    if (state.nextStep) {
      // Check if basic fields are valid first
      const basicFieldsValid = validateCreateAccount?.() || false;
      
      if (basicFieldsValid) {
        // If both terms and privacy are already accepted, proceed with account creation
        if (state.acceptTerms && state.acceptPrivacy) {
          toast.success(t('auth.success.accountCreated'));
          // Here you would normally submit the form to your backend
        } else {
          // Show legal modals flow
          dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: true });
        }
      }
      // If basic fields are not valid, validateCreateAccount will show errors
    } else {
      // On proceed step, validate email first
      if (!state.email || state.email.trim() === "") {
        setError(t('auth.validation.emailRequired'));
        return;
      }

      // Validate email format using the same validator
      const emailValidation = AuthValidator.validateEmail(state.email);
      if (!emailValidation.isValid) {
        setError(t(emailValidation.errors[0]));
        return;
      }

      // Email is valid, proceed to next step
      setError("");
      dispatch({ type: 'SET_NEXT_STEP', payload: true });
      toast.success(t('auth.success.emailPassed'));
    }
  };

  const isButtonDisabled = useMemo(() => {
    if (state.nextStep) {
      // On registration step, button is always enabled (validation happens on click)
      return false;
    } else {
      // On email step, button is disabled if email is empty but NOT if invalid
      return !state.email || state.email.trim() === "";
    }
  }, [state.nextStep, state.email]);

  const resetLegalModals = () => {
    dispatch({ type: 'SET_SHOW_LEGAL_MODALS', payload: false });
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
            {state.nextStep ? t('modal.registrationTitle') : t('auth.title')}
          </h2>
          <p className="text-gray-600 text-sm">
            {state.nextStep ? t('modal.registrationSubtitle') : t('auth.subtitle')}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            handleSubmit?.(e);
          }}
          className="space-y-6"
        >
          <AuthFormInput />
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {state.nextStep ? (
            <>
              {t('auth.alreadyHaveAccount')}{" "}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_NEXT_STEP', payload: false })}
                className="text-green-700 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                aria-label={t('auth.loginHere')}
              >
                {t('auth.loginHere')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-green-700 font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
              aria-label={t('auth.forgotPassword')}
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
