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
      borderTopColor: color.borderLight,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: theme === 'dark' ? 0.22 : 0.08,
      shadowRadius: 16,
      elevation: 12,
    },
    saveButton: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: color.white,
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
      borderRadius: 8,
      backgroundColor: color.cardSurface,
      borderWidth: 1,
      borderColor: color.borderLight,
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
