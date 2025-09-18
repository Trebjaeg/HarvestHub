"use client";

import { useEffect } from "react";
import AuthBanner from "./components/AuthBanner";
import AuthForm from "./components/AuthForm";
import { useTranslation } from "react-i18next";
import I18nProvider from "@/components/I18nProvider";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthErrorBoundary } from "./components/AuthErrorBoundary";
import { AuthValidator } from "@/lib/auth-validation";
import { validatePasswordStrength } from "@/lib/password-strength";

function AuthLandingContent() {
  const { t } = useTranslation();
  const { state, setError, dispatch } = useAuth();

  // Cleanup effect to clear form data on component unmount
  useEffect(() => {
    return () => {
      dispatch({ type: 'RESET_FORM' });
    };
  }, [dispatch]);

  // Enhanced validation function for create account
  const validateCreateAccount = (): boolean => {
    // Clear previous errors
    dispatch({ type: 'CLEAR_ALL_ERRORS' });

    const validationResult = AuthValidator.validateAuthForm({
      email: state.email,
      firstName: state.firstName,
      lastName: state.lastName,
      password: state.password,
      confirmPassword: state.confirmPassword,
      acceptTerms: state.acceptTerms,
      acceptPrivacy: state.acceptPrivacy,
    }, true);

    // Set individual field errors
    if (!validationResult.firstName.isValid) {
      dispatch({ 
        type: 'SET_FIRST_NAME_ERROR', 
        payload: t(validationResult.firstName.errors[0]) 
      });
    }

    if (!validationResult.lastName.isValid) {
      dispatch({ 
        type: 'SET_LAST_NAME_ERROR', 
        payload: t(validationResult.lastName.errors[0]) 
      });
    }

    if (!validationResult.password.isValid) {
      dispatch({ 
        type: 'SET_PASSWORD_ERROR', 
        payload: t(validationResult.password.errors[0]) 
      });
    }

    if (!validationResult.confirmPassword.isValid) {
      dispatch({ 
        type: 'SET_CONFIRM_PASSWORD_ERROR', 
        payload: t(validationResult.confirmPassword.errors[0]) 
      });
    }

    if (!validationResult.terms.isValid) {
      dispatch({ 
        type: 'SET_TERMS_ERROR', 
        payload: t(validationResult.terms.errors[0]) 
      });
    }

    if (!validationResult.privacy.isValid) {
      dispatch({ 
        type: 'SET_PRIVACY_ERROR', 
        payload: t(validationResult.privacy.errors[0]) 
      });
    }

    return AuthValidator.isFormValid(validationResult);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.email) {
      setError(t('auth.validation.emailRequired'));
      return;
    }

    // Validate email format
    const emailValidation = AuthValidator.validateEmail(state.email);
    if (!emailValidation.isValid) {
      setError(t(emailValidation.errors[0]));
      return;
    }

    setError("");
    // Continue submit logic here...
  };

  return (
    <AuthErrorBoundary>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left side - Background/Image section */}
        <AuthBanner />

        {/* Right side - Login form section */}
        <AuthForm
          key={`auth-form-${state.nextStep ? 'register' : 'login'}`}
          handleSubmit={handleSubmit}
          validateCreateAccount={validateCreateAccount}
        />
      </div>
    </AuthErrorBoundary>
  );
}

export default function AuthLanding() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AuthLandingContent />
      </AuthProvider>
    </I18nProvider>
  );
}
