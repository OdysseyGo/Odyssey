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
      paddingVertical: Spacing.xl,
      backgroundColor: 'red',
      borderBottomWidth: 1,
      borderBottomColor: color.foregroundSecondary,
      height: 60,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
    },
    headerButton: {
      padding: Spacing.sm,
    },
    saveButtonText: {
      fontWeight: '600',
      fontSize: 16,
    },
  });
};
