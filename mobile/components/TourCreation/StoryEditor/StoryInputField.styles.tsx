import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const storyInputFieldStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    inputGroup: {
      marginBottom: 0,
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
      backgroundColor: color.background,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: 16,
      color: color.text,
    },
    multilineInput: {
      minHeight: 180,
      textAlignVertical: 'top',
      lineHeight: 24,
    },
    characterCount: {
      fontSize: 12,
      color: color.subText,
      textAlign: 'right',
      marginTop: Spacing.xs,
      fontWeight: '600',
    },
  });
};
