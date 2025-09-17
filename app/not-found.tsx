"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import I18nProvider from '../components/I18nProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <>
      {/* Global CSS to hide scrollbars */}
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100vh;
        }
      `}</style>
      
      <div className="min-h-screen relative overflow-hidden">
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
        <div className="md:hidden h-screen w-full bg-white relative overflow-hidden">
          {/* Language Switcher for mobile only */}
          <div className="absolute top-6 right-6 z-20">
            <LanguageSwitcher />
          </div>
          
          {/* Kalimobile SVG - Full screen background */}
          <Image 
            src="/images/kalimobile.svg" 
            alt="Mobile illustration"
            fill
            className="object-cover"
            priority
          />

          {/* Mobile button positioned higher up */}
          <div className="absolute bottom-48 w-full flex justify-center px-6 z-10">
            <Link 
              href="/"
              className="bg-[#285508] hover:bg-[#1e3f06] text-white font-medium py-4 px-8 rounded-lg transition-colors shadow-lg"
            >
              {t('notFound.backButton')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NotFound() {
  return (
    <I18nProvider>
      <NotFoundContent />
    </I18nProvider>
  );
}