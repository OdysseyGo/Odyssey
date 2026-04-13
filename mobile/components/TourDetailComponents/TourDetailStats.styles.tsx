import { Platform, StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailStatsStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.sm,
      ...Platform.select({
        ios: {
          shadowColor: color.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      }),
    },
    statIcon: {
      marginBottom: 2,
    },
    statValue: {
      color: color.text,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    statLabel: {
      color: color.subText,
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
  });
};
