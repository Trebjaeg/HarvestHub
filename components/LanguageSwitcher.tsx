"use client";

import { FC } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tl' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="absolute top-2 right-2 bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-2 py-1 rounded-md transition-all duration-200 flex items-center gap-1 z-50 text-xs shadow"
    >
      <span>{i18n.language === 'en' ? 'PH' : 'US'}</span>
      <span>{i18n.language === 'en' ? 'Tagalog' : 'English'}</span>
    </button>
  );
};

LanguageSwitcher.displayName = "LanguageSwitcher";

export default LanguageSwitcher;
