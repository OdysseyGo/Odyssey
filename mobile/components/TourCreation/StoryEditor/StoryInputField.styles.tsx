import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const storyInputFieldStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    inputGroup: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    labelHint: {
      fontSize: 12,
      color: color.subText,
      marginBottom: Spacing.sm,
    },
    textInput: {
      backgroundColor: color.foregroundSecondary,
      borderWidth: 1,
      borderColor: color.border,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: 16,
      color: color.text,
    },
    multilineInput: {
      minHeight: 200,
      textAlignVertical: 'top',
      lineHeight: 24,
    },
    characterCount: {
      fontSize: 12,
      color: color.subText,
      textAlign: 'right',
      marginTop: Spacing.xs,
    },
  });
};
