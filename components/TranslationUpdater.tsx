import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslationUpdaterProps {
  children: React.ReactNode;
}

/**
 * A component that forces children to re-render when language changes
 * This ensures any stored translated strings get updated
 */
export const TranslationUpdater: React.FC<TranslationUpdaterProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const forceUpdateRef = useRef(0);
  const [, forceUpdate] = React.useReducer(() => forceUpdateRef.current++, 0);

  useEffect(() => {
    const handleLanguageChange = () => {
      // Force re-render of child components
      forceUpdate();
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return <>{children}</>;
};