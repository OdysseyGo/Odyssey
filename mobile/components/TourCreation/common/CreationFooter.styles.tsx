import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const creationFooterStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    footer: {
      padding: Spacing.lg,
      backgroundColor: color.foreground,
      borderTopWidth: 1,
      borderTopColor: color.borderLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: theme === 'dark' ? 0.22 : 0.08,
      shadowRadius: 16,
      elevation: 12,
    },
    button: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
      minHeight: 52,
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.26,
      shadowRadius: 10,
      elevation: 3,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: color.white,
    },
    buttonIcon: {
      color: color.white,
    },
  });
};
