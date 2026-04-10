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
      fontSize: 13,
      fontWeight: '600',
      color: color.subText,
      letterSpacing: 0.2,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: color.borderLight,
      backgroundColor: color.textBackground,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
    },
    inputRowFocused: {
      borderColor: color.primary,
    },
    inputRowError: {
      borderColor: color.error,
    },
    textInput: {
      flex: 1,
      paddingVertical: Spacing.lg,
      fontSize: 16,
      color: color.text,
    },
    toggleButton: {
      paddingLeft: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    error: {
      marginTop: 5,
      fontSize: 12,
      color: color.error,
    },
  });
};
