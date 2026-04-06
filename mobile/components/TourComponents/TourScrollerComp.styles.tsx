import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourScrollerCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      marginTop: Spacing.lg + 4,
    },

    // ─── Section header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
      flex: 1,
    },
    accentBar: {
      width: 3.5,
      height: 20,
      borderRadius: 2,
    },
    title: {
      color: color.text,
      fontSize: 19,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    countBadge: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: Spacing.borderRadiusFull,
    },
    countText: {
      fontSize: 12,
      fontWeight: '700',
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: '600',
    },

    // ─── List
    listContent: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.sm,
    },
    separator: {
      width: Spacing.md,
    },
  });
};
