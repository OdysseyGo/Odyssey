import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const storyEditorHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: color.foreground,
      borderBottomWidth: 1,
      borderBottomColor: color.borderLight,
      minHeight: 60,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
    },
    headerButton: {
      padding: Spacing.sm,
      minWidth: 56,
      alignItems: 'center',
    },
    saveButtonText: {
      fontWeight: '800',
      fontSize: 14,
    },
  });
};
