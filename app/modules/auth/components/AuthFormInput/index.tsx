"use client";

import { FC, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SuccessModal from "@/components/ui/SuccessModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { validatePasswordStrength, getPasswordStrengthColor } from "@/lib/password-strength";
import TrmsNConAndPP from "@/components/ui/trmsnconandpp";
import { TermsContent, PrivacyContent } from "@/components/legal/LegalContent";
import { useAuth } from "@/contexts/AuthContext";
import { AuthValidator } from "@/lib/auth-validation";
import { useTranslatableErrors } from "@/hooks/useTranslatableErrors";

const AuthFormInput: FC = () => {
  const { t } = useTranslation();
  const { login, refreshUser } = useAuth(); // Use new auth context
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state for form management
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    selectedRole: '',
    acceptTerms: false,
    acceptPrivacy: false,
    error: '',
    emailVerified: false,
    verificationCode: '',
    isNewUser: false,
    nextStep: false,
    loading: false
  });

  // Additional state for registration flow
  const [nextStep, setNextStep] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCodeExpires, setVerificationCodeExpires] = useState<Date | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Array<{
    id: string;
    name: string;
    description: string;
  }>>([]);

  // Helper function to update form state
  const updateFormState = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Legacy setters for compatibility
  const setEmail = (value: string) => updateFormState('email', value);
  const setPassword = (value: string) => updateFormState('password', value);
  const setConfirmPassword = (value: string) => updateFormState('confirmPassword', value);
  const setFirstName = (value: string) => updateFormState('firstName', value);
  const setLastName = (value: string) => updateFormState('lastName', value);
  const setAcceptTerms = (value: boolean) => updateFormState('acceptTerms', value);
  const setAcceptPrivacy = (value: boolean) => updateFormState('acceptPrivacy', value);
  const setEmailVerified = (value: boolean) => updateFormState('emailVerified', value);
  const setVerificationCode = (value: string) => updateFormState('verificationCode', value);
  const setError = (value: string) => updateFormState('error', value);

  // State object for compatibility with existing code
  const state = formState;

  // Use translatable errors for smooth translation
  const {
    setError: setFieldError,
    getError: getFieldError,
    clearError: clearFieldError,
    clearAllErrors: clearAllFieldErrors,
    hasError: hasFieldError
  } = useTranslatableErrors();

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<{
    isVerified: boolean;
    isPending: boolean;
    email?: string;
  }>({ isVerified: false, isPending: false });
  const passwordStrength = formState.password ? validatePasswordStrength(formState.password) : null;
  // Login pane state: first ask email, then show password (single button switches label)
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);

  // Reset verification code when modal is closed
  useEffect(() => {
    if (!showVerificationModal) {
      setVerificationCode('');
    }
  }, [showVerificationModal]);

  // Fetch available roles when registration form is shown
  useEffect(() => {
    if (state.nextStep && availableRoles.length === 0) {
      fetch('/api/auth/roles')
        .then(res => res.json())
        .then(data => {
          if (data.roles) {
            setAvailableRoles(data.roles);
          }
        })
        .catch(err => console.error('Failed to fetch roles:', err));
    }
  }, [state.nextStep, availableRoles.length]);

  // Animated loading indicator SVG (bigger, white bouncing dots)
  const LoadingDots = () => (
    <svg
      width="300"
      height="100"
      viewBox="0 0 120 30"
      className="size-12"
      role="img"
      aria-label="loading"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="30" cy="15" r="10" fill="#ffffff">
        <animate
          attributeName="cy"
          dur="0.8s"
          begin="0s"
          repeatCount="indefinite"
          values="15;5;15"
          keyTimes="0;0.5;1"
        />
        <animate
          attributeName="opacity"
          dur="0.8s"
          begin="0s"
          repeatCount="indefinite"
          values="0.4;1;0.4"
          keyTimes="0;0.5;1"
        />
      </circle>
      <circle cx="60" cy="15" r="10" fill="#ffffff">
        <animate
          attributeName="cy"
          dur="0.8s"
          begin="0.15s"
          repeatCount="indefinite"
          values="15;5;15"
          keyTimes="0;0.5;1"
        />
        <animate
          attributeName="opacity"
          dur="0.8s"
          begin="0.15s"
          repeatCount="indefinite"
          values="0.4;1;0.4"
          keyTimes="0;0.5;1"
        />
      </circle>
      <circle cx="90" cy="15" r="10" fill="#ffffff">
        <animate
          attributeName="cy"
          dur="0.8s"
          begin="0.3s"
          repeatCount="indefinite"
          values="15;5;15"
          keyTimes="0;0.5;1"
        />
        <animate
          attributeName="opacity"
          dur="0.8s"
          begin="0.3s"
          repeatCount="indefinite"
          values="0.4;1;0.4"
          keyTimes="0;0.5;1"
        />
      </circle>
    </svg>
  );

  // Function to validate name input (only letters, spaces, and common name characters) - SECURITY IMPROVEMENT
  const handleNameInput = (value: string, fieldType: 'firstName' | 'lastName') => {
    const sanitizedValue = AuthValidator.sanitizeNameInput(value);
    if (fieldType === 'firstName') {
      setFirstName(sanitizedValue);
    } else {
      setLastName(sanitizedValue);
    }
  };

  // Email verification handlers
  const handleSendVerificationCode = async () => {
    if (!state.email) {
      return;
    }
    
    // Clear any previous errors
    clearFieldError('general');
    setVerificationSuccessMessage('');
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerificationSent(true);
        const expiryTime = new Date(Date.now() + (10 * 60 * 1000)); // 10 minutes
        setVerificationCodeExpires(expiryTime);
        setVerificationCode('');
        setShowVerificationModal(true);
        setVerificationSuccessMessage(t('auth.verification.codeSent') || 'Verification code sent! Check your email.');
      } else {
        setFieldError('general', data.message || t('auth.error.sendCodeFailed') || 'Failed to send verification code');
      }
    } catch (error) {
      setFieldError('general', t('auth.error.sendCodeFailed') || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!state.verificationCode || state.verificationCode.length !== 6) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: state.email, 
          code: state.verificationCode 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.verified) {
        setEmailVerified(true);
        setVerificationCode('');
        setShowVerificationModal(false);
        setVerificationSuccessMessage(''); // Clear any previous success messages
        clearFieldError('general'); // Clear any previous errors
        // No need to show success message here since the modal closes
      } else {
        setVerificationSuccessMessage('');
        setFieldError('general', data.message || t('auth.verification.codeInvalid') || 'Invalid verification code');
      }
    } catch (error) {
      setFieldError('general', t('auth.validation.verificationCodeInvalid') || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };


  // Unified registration handler
  const handleRegisterUser = async () => {
    // Collect all validation errors in a temporary object
    const newErrors: { field: string; key: string }[] = [];
    
    if (!state.firstName.trim()) {
      newErrors.push({ field: 'firstName', key: 'auth.validation.firstNameRequired' });
    }
    if (!state.lastName.trim()) {
      newErrors.push({ field: 'lastName', key: 'auth.validation.lastNameRequired' });
    }
    if (!state.email.trim()) {
      newErrors.push({ field: 'email', key: 'auth.validation.emailRequired' });
    }
    if (!state.password) {
      newErrors.push({ field: 'password', key: 'auth.validation.passwordRequired' });
    }
    if (state.password !== state.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', key: 'auth.validation.passwordMismatch' });
    }
    if (!state.selectedRole) {
      newErrors.push({ field: 'role', key: 'auth.validation.roleRequired' });
    }
    
    // Check email verification (only if email is provided)
    if (state.email.trim() && !state.emailVerified) {
      newErrors.push({ field: 'email', key: 'auth.verification.emailMustBeVerified' });
    }
    
    // Clear previous errors first
    clearFieldError('firstName');
    clearFieldError('lastName');
    clearFieldError('email');
    clearFieldError('password');
    clearFieldError('confirmPassword');
    clearFieldError('role');
    
    // If there are errors, set them and return
    if (newErrors.length > 0) {
      // Set all errors
      newErrors.forEach(({ field, key }) => {
        setFieldError(field, key);
      });
      
      // Force scroll to first error after state updates
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }

    // If terms/privacy not accepted, open modals and wait
    if (!state.acceptTerms) {
      setShowTermsModal(true);
      return;
    }
    if (!state.acceptPrivacy) {
      setShowPrivacyModal(true);
      return;
    }

    // If all accepted, call API
    updateFormState('loading', true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${state.firstName.trim()} ${state.lastName.trim()}`.trim(),
          email: state.email,
          password: state.password,
          role: state.selectedRole,
          emailVerified: state.emailVerified,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store credentials temporarily for auto-login
      const registrationEmail = state.email;
      const registrationPassword = state.password;
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Auto-login after successful registration
      setTimeout(async () => {
        setShowSuccessModal(false);
        
        try {
          console.log('🔐 Auto-login after registration...');
          
          // Attempt to log the user in automatically
          const result = await login(registrationEmail, registrationPassword);
          
          if (result.success) {
            console.log('✅ Auto-login successful! Redirecting to home...');
            // Hard redirect to home page
            window.location.href = '/home';
          } else {
            console.log('❌ Auto-login failed, showing login form');
            // If auto-login fails, reset to login form with email pre-filled
            setFormState({
              email: registrationEmail,
              password: '',
              confirmPassword: '',
              firstName: '',
              lastName: '',
              selectedRole: '',
              acceptTerms: false,
              acceptPrivacy: false,
              error: '',
              emailVerified: false,
              verificationCode: '',
              isNewUser: false,
              nextStep: false,
              loading: false
            });
            setStep('password');
            setNextStep(false);
            clearAllFieldErrors();
          }
        } catch (err) {
          console.error('Auto-login error:', err);
          // On error, reset to login form with email pre-filled
          setFormState({
            email: registrationEmail,
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            selectedRole: '',
            acceptTerms: false,
            acceptPrivacy: false,
            error: '',
            emailVerified: false,
            verificationCode: '',
            isNewUser: false,
            nextStep: false,
            loading: false
          });
          setStep('password');
          setNextStep(false);
          clearAllFieldErrors();
        }
      }, 1500);

    } catch (err: any) {
      console.error('[Registration Error]', err);
      const errorMessage = err.message || t('auth.error.generic') || 'Registration failed';
      setFieldError('general', errorMessage);
      setError(errorMessage);
    } finally {
      updateFormState('loading', false);
    }
  };


  // When user accepts terms modal, set state and continue registration
  const handleAcceptTerms = () => {
    setAcceptTerms(true);
    setShowTermsModal(false);
    // If privacy not accepted, open privacy modal next
    if (!state.acceptPrivacy) {
      setShowPrivacyModal(true);
    } else {
      // Both accepted, continue registration
      handleRegisterUser();
    }
  };

  // When user accepts privacy modal, set state and continue registration
  const handleAcceptPrivacy = () => {
    setAcceptPrivacy(true);
    setShowPrivacyModal(false);
    // Both accepted, continue registration
    handleRegisterUser();
  };

  const resetLegalModals = () => {
    // Close any open modals (no dispatch needed for this)
  };
  
  // Step 2: Registration form - RESTORED ORIGINAL STRUCTURE
  if (state.nextStep) {
    return (
      <>
        <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
        <div className="space-y-6">
        {/* Top Back Control - Mobile Optimized with z-index */}
        <button
          type="button"
          className="relative z-10 inline-flex items-center text-green-700 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 rounded-lg p-3 -ml-2 active:bg-green-50 transition-all touch-manipulation min-h-[48px]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Reset to login view
            setStep('email');
            setNextStep(false);
            updateFormState('nextStep', false);
            updateFormState('email', '');
            updateFormState('password', '');
            updateFormState('firstName', '');
            updateFormState('lastName', '');
            updateFormState('selectedRole', '');
            clearAllFieldErrors();
          }}
          aria-label={t('auth.back') || 'Back'}
        >
          <span className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-md flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-4 sm:h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
            </svg>
          </span>
          <span className="ml-2 sm:ml-2 font-semibold text-base sm:text-sm">{t('auth.back') || 'Back'}</span>
        </button>
        {/* Name Section */}
        <div>
          <Label 
            className="block text-sm font-semibold text-gray-800 mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {t('auth.name')}
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                id="firstName"
                type="text"
                placeholder={t('auth.firstName')}
                value={state.firstName}
                onChange={(e) => handleNameInput(e.target.value, 'firstName')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-700 text-sm bg-gray-50 font-normal ${
                  hasFieldError('firstName')
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                }`}
              />
              {getFieldError('firstName') && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{getFieldError('firstName')}</p>
                </div>
              )}
            </div>
            <div>
              <Input
                id="lastName"
                type="text"
                placeholder={t('auth.lastName')}
                value={state.lastName}
                onChange={(e) => handleNameInput(e.target.value, 'lastName')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-700 text-sm bg-gray-50 font-normal ${
                  hasFieldError('lastName')
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                }`}
              />
              {getFieldError('lastName') && (
                <div className="mt-2 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-500">{getFieldError('lastName')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Section with Inline Verification */}
        <div>
          <Label 
            htmlFor="email" 
            className="block text-sm font-semibold text-gray-800 mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {t('auth.email')}
          </Label>
          
          {/* Email Input with Status */}
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={formState.email}
              readOnly
              className={`w-full h-12 rounded-lg border bg-gray-50 text-gray-600 px-4 py-3 pr-28 text-base ${
                hasFieldError('email')
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-green-500 focus:border-green-500"
              }`}
            />
            {state.emailVerified ? (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 border border-green-300 rounded-md">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-semibold text-green-700">
                    {t('auth.verification.verified') || 'Verified'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={loading || !state.email}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md min-w-[80px]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  </div>
                ) : (
                  t('auth.verify') || 'Verify'
                )}
              </button>
            )}
          </div>
          {getFieldError('email') && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{getFieldError('email')}</p>
            </div>
          )}
        </div>

        {/* Password Section - RESTORED ORIGINAL + SECURITY IMPROVEMENTS */}
        <div>
          <Label 
            htmlFor="password" 
            className="block text-sm font-semibold text-gray-800 mb-3"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formState.password}
              onChange={(e) => updateFormState('password', e.target.value)}
              autoComplete="new-password"
              className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-700 text-sm bg-gray-50 font-normal ${
                hasFieldError('password')
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-green-500 focus:border-green-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                // Visible -> show open eye icon (tap to hide)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                // Hidden -> show slashed eye icon (tap to show)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          {getFieldError('password') && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{getFieldError('password')}</p>
            </div>
          )}
          
          {/* Password Strength Indicator - SECURITY FEATURE */}
          {state.password && passwordStrength && (
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
                  <span className={state.password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                    {state.password.length >= 8 ? (
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
                  <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(state.password) ? 'text-green-600' : 'text-red-600'}>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(state.password) ? (
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

          {/* Confirm Password - RESTORED ORIGINAL */}
          <div className="mt-4">
            <Label 
              htmlFor="confirmPassword" 
              className="block text-sm font-semibold text-gray-800 mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {t('auth.confirmPassword')}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={state.confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-700 text-sm bg-gray-50 font-normal ${
                  hasFieldError('confirmPassword')
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  // Visible -> show open eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                ) : (
                  // Hidden -> show slashed eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {getFieldError('confirmPassword') && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{getFieldError('confirmPassword')}</p>
            </div>
          )}
        </div>

        {/* Role Selection Section */}
        <div>
          <Label 
            className="block text-sm font-semibold text-gray-800 mb-2"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {t('auth.selectRole') || 'Select Your Role'}
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  updateFormState('selectedRole', role.id);
                  clearFieldError('role');
                }}
                className={`relative p-4 border-2 rounded-lg transition-all duration-200 text-left touch-manipulation active:scale-[0.98] ${
                  state.selectedRole === role.id
                    ? 'border-green-500 bg-green-50'
                    : hasFieldError('role')
                    ? 'border-red-300 bg-white hover:border-red-400 active:bg-red-50'
                    : 'border-gray-200 bg-white hover:border-green-300 active:bg-green-50'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {/* Selection Indicator */}
                {state.selectedRole === role.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Role Name */}
                <h3 className={`text-base font-semibold mb-1 transition-colors ${
                  state.selectedRole === role.id ? 'text-green-700' : 'text-gray-900'
                }`}>
                  {role.name}
                </h3>
                
                {/* Role Description */}
                <p className="text-xs text-gray-600 leading-snug">
                  {role.description}
                </p>
              </button>
            ))}
          </div>
          
          {getFieldError('role') && (
            <div className="mt-2 flex items-center space-x-1">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{getFieldError('role') || t('auth.validation.roleRequired') || 'Please select a role'}</p>
            </div>
          )}
        </div>

        {/* General Error Display */}
        {(getFieldError('general') || state.error) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-600 font-medium">
                {getFieldError('general') || state.error}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons - NO CHECKBOXES, JUST BUTTONS */}
        <div className="space-y-4">
          <Button
            type="button"
            onClick={() => {
              // Always call handleRegisterUser directly
              handleRegisterUser();
            }}
            disabled={state.loading}
            variant="default"
            className="w-full h-12 sm:h-12 text-white font-semibold text-base rounded-lg disabled:opacity-50 active:scale-[0.98] transition-transform touch-manipulation"
          >
            {state.loading ? (
              <span className="flex items-center justify-center w-full">
                <LoadingDots />
              </span>
            ) : (
              t('auth.createAccount')
            )}
          </Button>
        </div>

        {/* Modals - RESTORED ORIGINAL */}
        <TrmsNConAndPP
          isOpen={showTermsModal}
          onClose={() => {
            setShowTermsModal(false);
            resetLegalModals();
          }}
          title={t('modal.termsTitle')}
          acceptText={t('modal.acceptTerms')}
          onAccept={handleAcceptTerms}
        >
          <TermsContent />
        </TrmsNConAndPP>

        <TrmsNConAndPP
          isOpen={showPrivacyModal}
          onClose={() => {
            setShowPrivacyModal(false);
            resetLegalModals();
          }}
          title={t('modal.privacyTitle')}
          acceptText={t('modal.acceptPrivacy')}
          onAccept={handleAcceptPrivacy}
        >
          <PrivacyContent />
        </TrmsNConAndPP>

        {/* Email Verification Modal - 6-digit code with z-[70] for mobile visibility */}
        {(() => {
          if (!showVerificationModal) return null;
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-600 sm:w-5 sm:h-5">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M14.52 2c1.029 0 2.015 .409 2.742 1.136l3.602 3.602a3.877 3.877 0 0 1 0 5.483l-2.643 2.643a3.88 3.88 0 0 1 -4.941 .452l-.105 -.078l-5.882 5.883a3 3 0 0 1 -1.68 .843l-.22 .027l-.221 .009h-1.172c-1.014 0 -1.867 -.759 -1.991 -1.823l-.009 -.177v-1.172c0 -.704 .248 -1.386 .73 -1.96l.149 -.161l.414 -.414a1 1 0 0 1 .707 -.293h1v-1a1 1 0 0 1 .883 -.993l.117 -.007h1v-1a1 1 0 0 1 .206 -.608l.087 -.1l1.468 -1.469l-.076 -.103a3.9 3.9 0 0 1 -.678 -1.963l-.007 -.236c0 -1.029 .409 -2.015 1.136 -2.742l2.643 -2.643a3.88 3.88 0 0 1 2.741 -1.136m.495 5h-.02a2 2 0 1 0 0 4h.02a2 2 0 1 0 0 -4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {t('auth.verification.verifyEmail') || 'Verify Your Email'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {t('auth.verification.enterCode') || 'Enter the 6-digit code we sent'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setVerificationCode('');
                    setVerificationSuccessMessage('');
                    clearFieldError('general');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {t('auth.verificationSubtitle') || 'We sent a verification code to'} <br />
                  <span className="font-semibold text-green-700 break-all">{state.email}</span>
                </p>

                {/* 6-Box Code Input */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={state.verificationCode[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 1) {
                          const newCode = state.verificationCode.split('');
                          newCode[index] = value;
                          const updatedCode = newCode.join('').slice(0, 6);
                          setVerificationCode(updatedCode);
                          
                          // Auto-focus next input
                          if (value && index < 5) {
                            const nextInput = e.target.parentNode?.children[index + 1] as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace to go to previous input
                        if (e.key === 'Backspace' && !state.verificationCode[index] && index > 0) {
                          const prevInput = (e.target as HTMLInputElement).parentNode?.children[index - 1] as HTMLInputElement;
                          prevInput?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(pastedData);
                        
                        // Focus the next empty input or last input
                        const nextEmptyIndex = Math.min(pastedData.length, 5);
                        const nextInput = (e.target as HTMLInputElement).parentNode?.children[nextEmptyIndex] as HTMLInputElement;
                        nextInput?.focus();
                      }}
                      className="w-8 h-8 sm:w-12 sm:h-12 text-center text-sm sm:text-lg font-mono font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all duration-200 bg-white"
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={loading || state.verificationCode.length !== 6}
                    className="w-full px-4 py-2.5 sm:py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('auth.verification.verifying') || 'Verifying...'}
                      </div>
                    ) : (
                      t('auth.verification.verifyEmail') || 'Verify Email'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={loading}
                    className="w-full px-4 py-2.5 sm:py-3 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg disabled:opacity-50 transition-colors duration-200"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {t('auth.verification.resendCode') || 'Resend Code'}
                  </button>
                </div>

                {/* Success Message Display */}
                {verificationSuccessMessage && (
                  <div className="mt-4 p-3 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {verificationSuccessMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {getFieldError('general') && (
                  <div className="mt-4 p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {getFieldError('general')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {formState.error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-500">{formState.error}</p>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  const handleButtonClick = async () => {
    // Clear field errors on new attempt
    clearFieldError('email');
    clearFieldError('loginPassword');
    if (step === 'email') {
      if (!formState.email) {
        setFieldError('email', 'auth.validation.emailRequired');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formState.email)) {
        setFieldError('email', 'auth.validation.emailInvalid');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formState.email })
        });
        const data = await res.json();
        if (res.status === 200 && data.exists) {
          // Known user → show password field and change button to Login
          setStep('password');
          clearFieldError('email');
        } else if (res.status === 200 && !data.exists) {
          // Unknown email → go to registration form
          // UI checks `formState.nextStep` (stored in formState), so update both
          // the nested formState and the local `nextStep` for compatibility.
          updateFormState('isNewUser', true);
          updateFormState('nextStep', true);
          setNextStep(true);
        } else {
          // For API error messages, we might not have translation keys, so store as is
          setFieldError('email', data.message || 'auth.validation.emailCheckError');
        }
      } catch (err) {
        setFieldError('email', 'auth.validation.emailCheckError');
      } finally {
        setLoading(false);
      }
    } else if (step === 'password') {
      // Perform login
      if (!formState.password) {
        setFieldError('loginPassword', 'auth.validation.passwordRequired');
        return;
      }
      
      setLoading(true);
      
      try {
        console.log('🔐 Starting login...');
        
        const result = await login(formState.email, formState.password);
        
        console.log('🔐 Login result:', result);
        
        if (result.success) {
          console.log('✅ Login successful! Cookie should be set now.');
          console.log('🔀 Forcing hard redirect to /home');
          
          // Use window.location.href for HARD redirect - forces full page reload
          // This ensures the cookie is sent with the next request
          window.location.href = '/home';
          
          // Don't set loading to false - page is reloading anyway
        } else {
          console.log('❌ Login failed:', result.message);
          
          // Display the error message directly from the API (includes suspended account messages)
          setFieldError('loginPassword', result.message || 'auth.validation.loginFailed');
          setLoading(false);
        }
        
      } catch (err: any) {
        console.error('❌ Login error:', err);
        setFieldError('loginPassword', 'auth.validation.loginFailed');
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {step === 'password' && (
        <button
          type="button"
          className="mb-4 inline-flex items-center text-green-700 hover:text-green-800 focus:outline-none"
          onClick={() => {
            // Allow user to edit email again
            setStep('email');
            setPassword('');
            clearFieldError('email');
            clearFieldError('loginPassword');
            clearAllFieldErrors();
          }}
          aria-label={t('auth.back') || 'Back'}
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow flex items-center justify-center">
            <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12l4-4m-4 4 4 4"/>
            </svg>
          </span>
          <span className="ml-2 font-medium">{t('auth.back') || 'Back'}</span>
        </button>
      )}
      <Label
        htmlFor="initialEmail"
        className="block text-sm font-semibold text-gray-800 mb-3"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {t('auth.email')}
      </Label>
      <Input
        id="initialEmail"
        type="text"
        placeholder="ex: myname@example.com"
        value={formState.email}
        onChange={(e) => updateFormState('email', e.target.value)}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-700 text-sm bg-gray-50 font-normal placeholder:text-gray-400 ${
          step === 'email' && hasFieldError('email')
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-green-500 focus:border-green-500"
        }`}
        disabled={step === 'password'}
      />
      {step === 'email' && getFieldError('email') && (
        <div className="mt-2 bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-500">{getFieldError('email')}</p>
          </div>
        </div>
      )}
      {step === 'password' && (
        <div className="mt-4">
          <Label htmlFor="loginPassword" className="block text-sm font-semibold text-gray-800 mb-3">
            {t('auth.password')}
          </Label>
          <div className="relative">
            <Input
              id="loginPassword"
              type={showLoginPassword ? "text" : "password"}
              placeholder={t('auth.password')}
              value={formState.password}
              onChange={(e) => updateFormState('password', e.target.value)}
              className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-700 text-sm bg-gray-50 font-normal ${
                hasFieldError('loginPassword') 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showLoginPassword ? (
                // Visible -> open eye icon
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                // Hidden -> slashed eye icon
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
          {getFieldError('loginPassword') && (
            <div className={`mt-2 p-4 rounded-lg border-2 ${
              getFieldError('loginPassword').toLowerCase().includes('suspended') || 
              getFieldError('loginPassword').toLowerCase().includes('deactivated') ||
              getFieldError('loginPassword').toLowerCase().includes('contact')
                ? 'bg-red-100 border-red-400'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {getFieldError('loginPassword')}
                  </p>
                  {(getFieldError('loginPassword').toLowerCase().includes('suspended') || 
                    getFieldError('loginPassword').toLowerCase().includes('deactivated') ||
                    getFieldError('loginPassword').toLowerCase().includes('contact')) && (
                    <p className="text-xs text-red-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      For assistance, contact: <a href="mailto:support@harvesthub.com" className="underline font-semibold">support@harvesthub.com</a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <Button
        className="mt-4 w-full h-12 font-semibold text-base rounded-lg"
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center w-full">
            <LoadingDots />
          </span>
        ) : step === 'email' ? (
          t('auth.proceed') || 'Proceed'
        ) : (
          t('auth.loginHere') || 'Login'
        )}
      </Button>
      {/* Bottom generic error removed for login; field-specific errors shown inline above */}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;