import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

/**
 * Hook that provides reactive translations that automatically update when language changes
 * Unlike regular useTranslation, this ensures stored translation keys update in real-time
 */
export const useReactiveTranslation = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Function that always returns fresh translation
  const rt = (key: string, options?: any) => {
    // Force re-evaluation by including current language in dependency
    return t(key, options);
  };

  return { t: rt, i18n, currentLanguage };
};