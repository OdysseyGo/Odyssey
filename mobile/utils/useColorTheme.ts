import { useColorScheme } from '@/components/useColorScheme';
import { ThemeName } from '@/constants/Colors';

export function useColorTheme() {
  const scheme = useColorScheme() ?? 'light';
  const theme = scheme as ThemeName;

  return theme;
}
