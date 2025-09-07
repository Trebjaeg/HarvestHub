"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail } from "@/lib/validate-email";
import { useEffect, useMemo, useState } from "react";
import AuthBanner from "./components/AuthBanner";
import AuthForm from "./components/AuthForm";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import I18nProvider from "@/components/I18nProvider";

export default function AuthLanding() {
  const { t } = useTranslation();
  
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [nextStep, setNextStep] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState<boolean>(false);
  const [acceptMarketing, setAcceptMarketing] = useState<boolean>(false);

  // Error states for validation
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [termsError, setTermsError] = useState<string>("");
  const [privacyError, setPrivacyError] = useState<string>("");

  // Validation function for create account
  const validateCreateAccount = () => {
    let isValid = true;

    // Clear previous errors
    setFirstNameError("");
    setLastNameError("");
    setPasswordError("");
    setConfirmPasswordError("");
    // Remove terms and privacy validation since they're handled in modals
    // setTermsError("");
    // setPrivacyError("");

    // Validate first name
    if (!firstName.trim()) {
      setFirstNameError(t('auth.errors.firstNameRequired'));
      isValid = false;
    }

    // Validate last name
    if (!lastName.trim()) {
      setLastNameError(t('auth.errors.lastNameRequired'));
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError(t('auth.errors.passwordRequired'));
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(t('auth.errors.passwordMinLength'));
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t('auth.errors.confirmPasswordRequired'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.errors.passwordsNoMatch'));
      isValid = false;
    }

    // Remove terms and privacy validation - they'll be handled by modals
    // if (!acceptTerms) {
    //   setTermsError(t('auth.errors.termsRequired'));
    //   isValid = false;
    // }
    // if (!acceptPrivacy) {
    //   setPrivacyError(t('auth.errors.privacyRequired'));
    //   isValid = false;
    // }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(t('auth.errors.emailRequired'));
      return;
    }

    // Optional: extra validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.errors.emailInvalid'));
      return;
    }

    setError("");
    // Continue submit logic here...
  };

  return (
    <I18nProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left side - Background/Image section */}
        <AuthBanner />

        {/* Right side - Login form section */}
      <AuthForm
        email={email}
        error={error}
        setError={setError}
        nextStep={nextStep}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleSubmit={handleSubmit}
        setNextStep={(nextStep) => setNextStep(nextStep)}
        isNewUser={isNewUser}
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
        firstNameError={firstNameError}
        lastNameError={lastNameError}
        passwordError={passwordError}
        confirmPasswordError={confirmPasswordError}
        termsError={termsError}
        privacyError={privacyError}
        validateCreateAccount={validateCreateAccount}
      />
      </div>
    </I18nProvider>
  );
}
