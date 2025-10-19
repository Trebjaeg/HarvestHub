"use client";

import { useState } from "react";
import AuthBanner from "./components/AuthBanner";
import AuthForm from "./components/AuthForm";
import { useTranslation } from "react-i18next";
import I18nProvider from "@/components/I18nProvider";
import { AuthErrorBoundary } from "./components/AuthErrorBoundary";

function AuthLandingContent() {
  const { t } = useTranslation();
  
  // Simple local state for any form-level errors
  const [error, setError] = useState("");

  // Enhanced validation function for create account
  const validateCreateAccount = (): boolean => {
    // AuthFormInput handles its own validation now
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    // AuthFormInput handles submit logic
  };

  return (
    <AuthErrorBoundary>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left side - Background/Image section */}
        <AuthBanner />

        {/* Right side - Login form section */}
        <AuthForm
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
      <AuthLandingContent />
    </I18nProvider>
  );
}
