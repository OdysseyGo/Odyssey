import { useColorScheme } from '@/components/useColorScheme';
import { ThemeName } from '@/constants/Colors';
import { useOptionalTheme } from '@/contexts/ThemeContext';

export function useColorTheme() {
  const themeContext = useOptionalTheme();

  if (themeContext) {
    return themeContext.theme;
  }

  const scheme = useColorScheme() ?? 'light';
  const theme = scheme as ThemeName;

  return theme;
}
