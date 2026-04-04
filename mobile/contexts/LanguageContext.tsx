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

const LANGUAGE_KEY = 'app_language';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(i18n.language);

  useEffect(() => {
    SecureStore.getItemAsync(LANGUAGE_KEY).then((saved) => {
      if (saved && saved !== i18n.language) {
        i18n.changeLanguage(saved);
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: string) => {
    await i18n.changeLanguage(lang);
    setLanguageState(lang);
    await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
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
