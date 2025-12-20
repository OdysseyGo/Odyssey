import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const generateButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    footer: {
      padding: Spacing.lg,
      backgroundColor: color.foreground,
      borderTopWidth: 1,
      borderTopColor: color.foregroundSecondary,
    },
    button: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: color.white,
    },
  });
};
