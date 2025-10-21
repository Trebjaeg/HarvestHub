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

    // Check if i18n has event methods before using them
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', handleLanguageChange);
    }
    
    return () => {
      if (i18n && typeof i18n.off === 'function') {
        i18n.off('languageChanged', handleLanguageChange);
      }
    };
  }, [i18n]);

  // Function that always returns fresh translation
  // Accept the same flexible argument signature as i18next's `t` function
  const rt = (...args: any[]): string => {
    // Force re-evaluation by including current language in dependency
    const result = (t as any)(...args);
    return typeof result === 'string' ? result : String(result);
  };

  return { t: rt, i18n, currentLanguage };
};