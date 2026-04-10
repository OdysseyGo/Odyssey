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
      gap: Spacing.xs,
    },
    statIcon: {
      marginBottom: Spacing.xs / 2,
    },
    statValue: {
      color: color.text,
      fontSize: 17,
      fontWeight: '800',
    },
    statLabel: {
      color: color.subText,
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statDivider: {
      width: 1,
      backgroundColor: color.subText,
      opacity: 0.15,
      marginVertical: Spacing.xs,
    },
  });
};
