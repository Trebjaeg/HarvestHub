import { FC } from "react";
import { AuthFormProps } from "../AuthForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
}) => {
  // Step 2: Registration form
  if (nextStep) {
    return (
      <div className="space-y-4">
        {/* First Name */}
        <div>
          <Label htmlFor="firstName" className="block text-md font-medium text-gray-700 mb-2">
            First name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName?.(e.target.value)}
            className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent ${
              firstNameError
                ? "border border-red-500 focus:ring-red-500"
                : "border border-gray-300 focus:ring-green-600"
            }`}
          />
          {firstNameError && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">*</span> {firstNameError}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName" className="block text-md font-medium text-gray-700 mb-2">
            Last name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName?.(e.target.value)}
            className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent ${
              lastNameError
                ? "border border-red-500 focus:ring-red-500"
                : "border border-gray-300 focus:ring-green-600"
            }`}
          />
          {lastNameError && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">*</span> {lastNameError}
            </p>
          )}
        </div>

        {/* Email (display only) */}
        <div>
          <Label htmlFor="email" className="block text-md font-medium text-gray-700 mb-2">
            Your email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            className="w-full rounded-md px-4 py-3 border border-gray-300 bg-gray-50 text-gray-600"
          />
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password" className="block text-md font-medium text-gray-700 mb-2">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword?.(e.target.value)}
            className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent ${
              passwordError
                ? "border border-red-500 focus:ring-red-500"
                : "border border-gray-300 focus:ring-green-600"
            }`}
          />
          {passwordError && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">*</span> {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword" className="block text-md font-medium text-gray-700 mb-2">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword?.(e.target.value)}
            className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent ${
              confirmPasswordError
                ? "border border-red-500 focus:ring-red-500"
                : "border border-gray-300 focus:ring-green-600"
            }`}
          />
          {confirmPasswordError && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">*</span> {confirmPasswordError}
            </p>
          )}
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms?.(e.target.checked)}
              className={`mr-2 mt-1 ${termsError ? "border-red-500" : ""}`}
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="text-sm">
                I accept the Terms and Conditions
              </Label>
              {termsError && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <span className="mr-1">*</span> {termsError}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="privacy"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy?.(e.target.checked)}
              className={`mr-2 mt-1 ${privacyError ? "border-red-500" : ""}`}
            />
            <div className="flex-1">
              <Label htmlFor="privacy" className="text-sm">
                I accept the Privacy Policy
              </Label>
              {privacyError && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <span className="mr-1">*</span> {privacyError}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm m-0 mb-2 flex items-center">
            <span className="mr-1">⚠️</span> {error}
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
        className="block text-md font-medium text-gray-700 mb-2"
      >
        Email
      </Label>
      <Input
        id="initialEmail"
        type="email"
        value={email}
        onChange={(e) => setEmail?.(e.target.value)}
        className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent mb-2
              ${
                error
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-gray-300 focus:ring-green-600"
              }`}
      />
      {error && (
        <p className="text-red-600 text-sm m-0 mb-2 flex items-center">
          <span className="mr-1">*</span> {error}
        </p>
      )}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;
