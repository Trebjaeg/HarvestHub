"use client";

import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  variant?: 'header' | 'auth';
}

const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ variant = 'auth' }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tl' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (variant === 'header') {
    return (
      <button 
        onClick={toggleLanguage}
        className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
        style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="text-white text-sm">{i18n.language === 'en' ? 'PH' : 'EN'}</span>
      </button>
    );
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="absolute top-4 right-4 z-50"
      style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '400' }}
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span>{i18n.language === 'en' ? 'PH' : 'EN'}</span>
    </Button>
  );
};

LanguageSwitcher.displayName = "LanguageSwitcher";

export default LanguageSwitcher;
