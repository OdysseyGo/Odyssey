import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailStatsStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    statsRow: {
      flexDirection: 'row',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      color: color.primary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    statLabel: {
      color: color.subText,
      fontSize: 12,
    },
    statDivider: {
      width: 1,
      backgroundColor: color.subText,
      opacity: 0.3,
      marginVertical: Spacing.xs,
    },
  });
};
