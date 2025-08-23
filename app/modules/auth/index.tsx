"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail } from "@/lib/validate-email";
import { useEffect, useMemo, useState } from "react";
import AuthBanner from "./components/AuthBanner";
import AuthForm from "./components/AuthForm";

export default function AuthLanding() {
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
    setTermsError("");
    setPrivacyError("");

    // Validate first name
    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      isValid = false;
    }

    // Validate last name
    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    // Validate terms acceptance
    if (!acceptTerms) {
      setTermsError("You must accept the Terms and Conditions");
      isValid = false;
    }

    // Validate privacy acceptance
    if (!acceptPrivacy) {
      setPrivacyError("You must accept the Privacy Policy");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Optional: extra validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    // Continue submit logic here...
  };

  return (
    <div className="flex h-screen">
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
        acceptMarketing={acceptMarketing}
        setAcceptMarketing={setAcceptMarketing}
        firstNameError={firstNameError}
        lastNameError={lastNameError}
        passwordError={passwordError}
        confirmPasswordError={confirmPasswordError}
        termsError={termsError}
        privacyError={privacyError}
        validateCreateAccount={validateCreateAccount}
      />
    </div>
  );
}
