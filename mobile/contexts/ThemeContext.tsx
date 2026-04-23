import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from '@/components/useColorScheme';
import { ThemeName } from '@/constants/Colors';

const THEME_PREFERENCE_KEY = 'app_theme_preference';

type ThemePreference = ThemeName | 'system';

type ThemeContextType = {
  theme: ThemeName;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  const theme: ThemeName = useMemo(() => {
    if (themePreference === 'system') {
      return (systemScheme ?? 'light') as ThemeName;
    }

    return themePreference;
  }, [systemScheme, themePreference]);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_PREFERENCE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemePreferenceState(saved);
      }
    });
  }, []);

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemePreferenceState(next);
    await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, next);
  }, [theme]);

  const contextValue = useMemo(
    () => ({
      theme,
      themePreference,
      setThemePreference,
      toggleTheme,
    }),
    [setThemePreference, theme, themePreference, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export function useOptionalTheme() {
  return useContext(ThemeContext);
}
