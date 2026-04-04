import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourScrollerCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      marginTop: Spacing.md,
    },

    // ─── Section header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
      flex: 1,
    },
    accentBar: {
      width: 4,
      height: 22,
      borderRadius: 3,
    },
    title: {
      color: color.text,
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.4,
    },
    countBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
      borderRadius: Spacing.borderRadiusFull,
      marginLeft: Spacing.sm,
    },
    countText: {
      fontSize: 13,
      fontWeight: '700',
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
