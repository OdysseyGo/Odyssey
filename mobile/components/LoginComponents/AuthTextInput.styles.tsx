import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const getPlaceholderColor = (theme: ThemeName) => {
  const color = Colors[theme];
  return color.placeholderTextColor;
};

export const authTextInputStyle = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    wrapper: {
      marginBottom: Spacing.md,
      width: '100%',
    },
    label: {
      marginBottom: Spacing.xs,
      fontSize: 14,
      fontWeight: '500',
      color: color.primary,
    },
    input: {
      borderWidth: 1,
      borderColor: color.border,
      backgroundColor: color.textBackground,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.lg,
      fontSize: 16,
      color: color.primary,
    },
    inputError: {
      borderColor: color.error,
    },
    error: {
      marginTop: 4,
      fontSize: 12,
      color: color.error,
    },
  });
};
