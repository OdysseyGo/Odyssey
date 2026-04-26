import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourReviewStepStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    content: {
      flex: 1,
      backgroundColor: color.background,
    },
    scrollContent: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
  });
};
