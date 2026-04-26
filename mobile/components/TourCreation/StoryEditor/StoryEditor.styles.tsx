import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const storyEditorStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      width: '100%',
    },
    scrollContainer: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    introCard: {
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
    },
    formCard: {
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
  });
};
