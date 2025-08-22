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
      />
    </div>
  );
}
