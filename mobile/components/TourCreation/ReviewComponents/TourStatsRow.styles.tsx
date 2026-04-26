import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourStatsRowStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: color.borderLight,
      gap: Spacing.sm,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
      backgroundColor: color.background,
      borderRadius: 8,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xs,
      minHeight: 86,
      justifyContent: 'center',
    },
    statIcon: {
      color: color.primary,
      marginBottom: Spacing.xs,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
      color: color.primary,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: color.subText,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
  });
};
