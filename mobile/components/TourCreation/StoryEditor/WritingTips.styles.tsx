import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const writingTipsStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    tipsContainer: {
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.xs,
    },
    tipBullet: {
      fontSize: 12,
      color: color.primary,
      marginRight: Spacing.xs,
      marginTop: 2,
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      color: color.subText,
      lineHeight: 18,
    },
  });
};
