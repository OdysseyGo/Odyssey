import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const authButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    button: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      marginTop: Spacing.sm,
      width: '100%',
      maxWidth: 400,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    title: {
      color: color.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
};
