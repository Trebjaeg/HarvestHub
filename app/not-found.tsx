"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import I18nProvider from '../components/I18nProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative">
      {/* Desktop View - Hidden on mobile */}
      <div className="hidden md:block min-h-screen bg-cover bg-center bg-no-repeat relative" style={{backgroundImage: 'url(/images/404.svg)'}}>
        {/* Button positioned below image for desktop */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
          <Link 
            href="/"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-full transition-colors shadow-md hover:shadow-lg"
          >
            Back to homepage
          </Link>
        </div>
      </div>

      {/* Mobile View - Hidden on desktop */}
      <div className="md:hidden min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        {/* Language Switcher for mobile only */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        
        {/* 404 Content for mobile */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">{t('notFound.title')}</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            {t('notFound.message')}
          </p>
        </div>

        {/* Mobile-friendly button */}
        <Link 
          href="/"
          className="w-full max-w-xs bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg text-center"
        >
          {t('notFound.backButton')}
        </Link>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <I18nProvider>
      <NotFoundContent />
    </I18nProvider>
  );
}