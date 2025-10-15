"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface AuthState {
  // User input data
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  
  // Form flow state
  nextStep: boolean;
  isNewUser: boolean;
  
  // Email verification state
  emailVerified: boolean;
  verificationCode: string;
  verificationSent: boolean;
  verificationCodeExpires: number;
  
  // Legal acceptance
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
  
  // Error states
  error: string;
  firstNameError: string;
  lastNameError: string;
  passwordError: string;
  confirmPasswordError: string;
  termsError: string;
  privacyError: string;
  
  // UI state
  loading: boolean;
  showLegalModals: boolean;
}

export type AuthAction = 
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
  | { type: 'SET_FIRST_NAME'; payload: string }
  | { type: 'SET_LAST_NAME'; payload: string }
  | { type: 'SET_NEXT_STEP'; payload: boolean }
  | { type: 'SET_IS_NEW_USER'; payload: boolean }
  | { type: 'SET_EMAIL_VERIFIED'; payload: boolean }
  | { type: 'SET_VERIFICATION_CODE'; payload: string }
  | { type: 'SET_VERIFICATION_SENT'; payload: boolean }
  | { type: 'SET_VERIFICATION_CODE_EXPIRES'; payload: number }
  | { type: 'SET_ACCEPT_TERMS'; payload: boolean }
  | { type: 'SET_ACCEPT_PRIVACY'; payload: boolean }
  | { type: 'SET_ACCEPT_MARKETING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_FIRST_NAME_ERROR'; payload: string }
  | { type: 'SET_LAST_NAME_ERROR'; payload: string }
  | { type: 'SET_PASSWORD_ERROR'; payload: string }
  | { type: 'SET_CONFIRM_PASSWORD_ERROR'; payload: string }
  | { type: 'SET_TERMS_ERROR'; payload: string }
  | { type: 'SET_PRIVACY_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_LEGAL_MODALS'; payload: boolean }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_TO_EMAIL_STEP' }
  | { type: 'RESET_FORM' };

const initialState: AuthState = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  nextStep: false,
  isNewUser: false,
  emailVerified: false,
  verificationCode: "",
  verificationSent: false,
  verificationCodeExpires: 0,
  acceptTerms: false,
  acceptPrivacy: false,
  acceptMarketing: false,
  error: "",
  firstNameError: "",
  lastNameError: "",
  passwordError: "",
  confirmPasswordError: "",
  termsError: "",
  privacyError: "",
  loading: false,
  showLegalModals: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    case 'SET_CONFIRM_PASSWORD':
      return { ...state, confirmPassword: action.payload };
    case 'SET_FIRST_NAME':
      return { ...state, firstName: action.payload };
    case 'SET_LAST_NAME':
      return { ...state, lastName: action.payload };
    case 'SET_NEXT_STEP':
      return { ...state, nextStep: action.payload };
    case 'SET_IS_NEW_USER':
      return { ...state, isNewUser: action.payload };
    case 'SET_EMAIL_VERIFIED':
      return { ...state, emailVerified: action.payload };
    case 'SET_VERIFICATION_CODE':
      return { ...state, verificationCode: action.payload };
    case 'SET_VERIFICATION_SENT':
      return { ...state, verificationSent: action.payload };
    case 'SET_VERIFICATION_CODE_EXPIRES':
      return { ...state, verificationCodeExpires: action.payload };
    case 'SET_ACCEPT_TERMS':
      return { ...state, acceptTerms: action.payload };
    case 'SET_ACCEPT_PRIVACY':
      return { ...state, acceptPrivacy: action.payload };
    case 'SET_ACCEPT_MARKETING':
      return { ...state, acceptMarketing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FIRST_NAME_ERROR':
      return { ...state, firstNameError: action.payload };
    case 'SET_LAST_NAME_ERROR':
      return { ...state, lastNameError: action.payload };
    case 'SET_PASSWORD_ERROR':
      return { ...state, passwordError: action.payload };
    case 'SET_CONFIRM_PASSWORD_ERROR':
      return { ...state, confirmPasswordError: action.payload };
    case 'SET_TERMS_ERROR':
      return { ...state, termsError: action.payload };
    case 'SET_PRIVACY_ERROR':
      return { ...state, privacyError: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SHOW_LEGAL_MODALS':
      return { ...state, showLegalModals: action.payload };
    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        error: "",
        firstNameError: "",
        lastNameError: "",
        passwordError: "",
        confirmPasswordError: "",
        termsError: "",
        privacyError: "",
      };
    case 'RESET_TO_EMAIL_STEP':
      return {
        ...state,
        nextStep: false,
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        firstNameError: "",
        lastNameError: "",
        passwordError: "",
        confirmPasswordError: "",
        error: "",
      };
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  
  // Convenience methods to maintain same API
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setNextStep: (nextStep: boolean) => void;
  setError: (error: string) => void;
  setAcceptTerms: (accept: boolean) => void;
  setAcceptPrivacy: (accept: boolean) => void;
  setAcceptMarketing: (accept: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  setVerificationCode: (code: string) => void;
  setVerificationSent: (sent: boolean) => void;
  setVerificationCodeExpires: (expires: number) => void;
  clearAllErrors: () => void;
  resetForm: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Convenience methods that maintain the same API as before
  const contextValue: AuthContextType = {
    state,
    dispatch,
    setEmail: (email: string) => dispatch({ type: 'SET_EMAIL', payload: email }),
    setPassword: (password: string) => dispatch({ type: 'SET_PASSWORD', payload: password }),
    setConfirmPassword: (password: string) => dispatch({ type: 'SET_CONFIRM_PASSWORD', payload: password }),
    setFirstName: (name: string) => dispatch({ type: 'SET_FIRST_NAME', payload: name }),
    setLastName: (name: string) => dispatch({ type: 'SET_LAST_NAME', payload: name }),
    setNextStep: (nextStep: boolean) => dispatch({ type: 'SET_NEXT_STEP', payload: nextStep }),
    setError: (error: string) => dispatch({ type: 'SET_ERROR', payload: error }),
    setAcceptTerms: (accept: boolean) => dispatch({ type: 'SET_ACCEPT_TERMS', payload: accept }),
    setAcceptPrivacy: (accept: boolean) => dispatch({ type: 'SET_ACCEPT_PRIVACY', payload: accept }),
    setAcceptMarketing: (accept: boolean) => dispatch({ type: 'SET_ACCEPT_MARKETING', payload: accept }),
    setEmailVerified: (verified: boolean) => dispatch({ type: 'SET_EMAIL_VERIFIED', payload: verified }),
    setVerificationCode: (code: string) => dispatch({ type: 'SET_VERIFICATION_CODE', payload: code }),
    setVerificationSent: (sent: boolean) => dispatch({ type: 'SET_VERIFICATION_SENT', payload: sent }),
    setVerificationCodeExpires: (expires: number) => dispatch({ type: 'SET_VERIFICATION_CODE_EXPIRES', payload: expires }),
    clearAllErrors: () => dispatch({ type: 'CLEAR_ALL_ERRORS' }),
    resetForm: () => dispatch({ type: 'RESET_FORM' }),
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}