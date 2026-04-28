import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import i18n from '@/i18n/i18n';
import {
  getDeviceLanguage,
  LanguagePreferenceCode,
  resolveAppLanguage,
  resolveLanguagePreference,
  resolveSupportedLanguage,
  SYSTEM_LANGUAGE_PREFERENCE,
  SupportedLanguageCode,
} from '@/i18n/languageConfig';

const LANGUAGE_KEY = 'app_language';

interface LanguageContextType {
  language: SupportedLanguageCode;
  languagePreference: LanguagePreferenceCode;
  setLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(resolveSupportedLanguage(i18n.language));
  const [languagePreference, setLanguagePreferenceState] = useState<LanguagePreferenceCode>(
    SYSTEM_LANGUAGE_PREFERENCE
  );

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY).then((saved) => {
      const resolvedLanguagePreference = resolveLanguagePreference(saved);
      const resolvedLanguage = resolveAppLanguage(resolvedLanguagePreference);
      if (resolvedLanguage !== i18n.language) {
        i18n.changeLanguage(resolvedLanguage);
      }
      setLanguagePreferenceState(resolvedLanguagePreference);
      setLanguageState(resolvedLanguage);
    });
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    const resolvedLanguagePreference = resolveLanguagePreference(lang);
    const resolvedLanguage =
      resolvedLanguagePreference === SYSTEM_LANGUAGE_PREFERENCE
        ? getDeviceLanguage()
        : resolveSupportedLanguage(resolvedLanguagePreference);
    await i18n.changeLanguage(resolvedLanguage);
    setLanguagePreferenceState(resolvedLanguagePreference);
    setLanguageState(resolvedLanguage);
    await SecureStore.setItemAsync(LANGUAGE_KEY, resolvedLanguagePreference);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, languagePreference, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
