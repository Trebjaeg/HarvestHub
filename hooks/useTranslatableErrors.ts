import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

interface TranslatedError {
  key: string;
  params?: any;
}

/**
 * Hook for managing translatable error states
 * Automatically re-translates error messages when language changes
 */
export const useTranslatableErrors = () => {
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<Record<string, TranslatedError | null>>({});

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      // Trigger re-render to get fresh translations
      setErrors(prevErrors => ({ ...prevErrors }));
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const setError = (field: string, translationKey: string | null, params?: any) => {
    setErrors(prev => ({
      ...prev,
      [field]: translationKey ? { key: translationKey, params } : null
    }));
  };

  const getError = (field: string): string | null => {
    const error = errors[field];
    return error ? String(t(error.key, error.params)) : null;
  };

  const clearError = (field: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    setError,
    getError,
    clearError,
    clearAllErrors,
    hasError: (field: string) => !!errors[field]
  };
};