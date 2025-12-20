import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourStatsRowStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: color.primary,
    },
    statLabel: {
      fontSize: 12,
      color: color.subText,
      marginTop: Spacing.xs,
    },
  });
};
