import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailScreenStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      padding: Spacing.lg,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: 16,
    },
    errorText: {
      marginTop: Spacing.md,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    retryText: {
      marginTop: Spacing.md,
      fontSize: 16,
      fontWeight: '600',
    },
    bottomSpacer: {
      height: 100,
    },
  });
};
