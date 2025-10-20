"use client";

import { FC, useState } from "react";
import AuthFormInput from "../AuthFormInput";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ForgotPasswordModal from "../ForgotPasswordModal";
import Image from "next/image";

export interface AuthFormProps {
  handleSubmit?: (e: React.FormEvent) => void;
  validateCreateAccount?: () => boolean;
}

const AuthForm: FC<AuthFormProps> = ({
  handleSubmit,
  validateCreateAccount,
}) => {
  const { t } = useTranslation();
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  return (
    <div className="w-full lg:w-1/2 flex items-start justify-center p-4 sm:p-6 md:p-8 bg-gray-50 relative min-h-screen lg:min-h-0 overflow-y-auto">
      <LanguageSwitcher />
      <div className="w-full max-w-md shadow-xl rounded-2xl bg-white p-6 sm:p-8 mx-auto border border-gray-100 my-4">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-center items-center mb-4">
            <Image
              src="/images/harvesthub.png"
              alt="Harvest Hub"
              width={32}
              height={32}
            />
            <h1 className="text-base sm:text-lg font-medium text-green-700 ml-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Harvest Hub
            </h1>
          </div>
          <h2 className="text-xl sm:text-2xl font-medium mb-2 text-gray-900 text-left" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {t('auth.title')}
          </h2>
          <p className="text-gray-600 text-sm text-left" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
            {t('auth.subtitle')}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            handleSubmit?.(e);
          }}
          className="space-y-4 sm:space-y-6"
        >
          <AuthFormInput />
        </form>

        <p className="text-center mt-4 sm:mt-6 text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}>
          <button
            type="button"
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-green-700 font-medium hover:underline cursor-pointer bg-transparent border-none p-0"
            style={{ fontFamily: 'Poppins, sans-serif' }}
            aria-label={t('auth.forgotPassword')}
          >
            {t('auth.forgotPassword')}
          </button>
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
