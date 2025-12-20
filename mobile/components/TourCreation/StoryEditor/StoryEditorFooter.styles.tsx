import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const storyEditorFooterStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    footer: {
      padding: Spacing.lg,
      backgroundColor: color.foreground,
      borderTopWidth: 1,
      borderTopColor: color.foregroundSecondary,
    },
    saveButton: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    navButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foregroundSecondary,
      gap: Spacing.xs,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
    },
  });
};
