import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourSummaryCardStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    description: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
    },
  });
};
