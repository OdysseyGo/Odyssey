import { useColorScheme } from '@/components/useColorScheme';
import { ThemeName } from '@/constants/Colors';
import { useOptionalTheme } from '@/contexts/ThemeContext';

export function useColorTheme() {
  const themeContext = useOptionalTheme();
  const scheme = useColorScheme() ?? 'light';

  if (themeContext) {
    return themeContext.theme;
  }

  const theme = scheme as ThemeName;

  return theme;
}
