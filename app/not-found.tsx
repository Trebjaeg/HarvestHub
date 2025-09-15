"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import I18nProvider from '../components/I18nProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{backgroundColor: '#E7FFF8'}}>
      <LanguageSwitcher />
      
      <div className="flex items-center justify-center max-w-4xl mx-auto px-8">
        {/* Left side - Kali Character */}
        <div className="relative mr-16">
          <img 
            src="/images/kalithekalabaw.png" 
            alt="Kali the Kalabaw" 
            className="h-96 w-auto"
          />
          
          {/* Speech Bubble */}
          <div className="absolute -top-12 left-20 bg-green-500 text-white px-6 py-4 rounded-3xl shadow-lg">
            <span className="text-2xl font-bold">404</span>
            {/* Speech bubble tail */}
            <div className="absolute bottom-0 left-8 transform translate-y-full">
              <div className="w-0 h-0 border-l-6 border-r-6 border-t-8 border-transparent border-t-green-500"></div>
            </div>
          </div>
        </div>

        {/* Right side - Text Content */}
        <div className="text-left">
          <h1 className="text-7xl font-bold text-green-500 mb-4">
            OOPS!
          </h1>
          <p className="text-3xl text-gray-600 mb-8">
            Looks like Kali<br />
            bit the cord.
          </p>
          
          <Link 
            href="/"
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-full transition-colors shadow-md"
          >
            Back to homepage
          </Link>
        </div>
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