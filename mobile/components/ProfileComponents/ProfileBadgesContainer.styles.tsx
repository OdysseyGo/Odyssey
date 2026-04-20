import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileBadgesContainerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    container: {
      marginTop: Spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
    },
    accentBar: {
      width: 3.5,
      height: 20,
      borderRadius: 2,
      backgroundColor: color.secondary,
    },
    title: {
      fontSize: 19,
      fontWeight: '700',
      color: color.text,
      letterSpacing: -0.3,
    },
    countBadge: {
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: Spacing.borderRadiusFull,
      backgroundColor: color.primaryMuted,
    },
    countText: {
      fontSize: 12,
      fontWeight: '700',
      color: color.primary,
    },

    // Scroll
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },

    // Badge item
    badgeCard: {
      width: 100,
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      backgroundColor: color.cardSurface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isLight ? color.borderLight : color.foregroundSecondary,
      ...(isLight
        ? Platform.select({
            ios: {
              shadowColor: 'rgba(45,50,68,0.10)',
              shadowOpacity: 1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            },
            android: { elevation: 2 },
          })
        : {}),
    },
    badgeCardUnlocked: {
      borderWidth: 1.5,
      borderColor: isLight ? color.primary : color.primary,
      backgroundColor: isLight ? `${color.primary}06` : color.cardSurface,
    },
    badgeIcon: {
      fontSize: 36,
      marginBottom: Spacing.sm,
    },
    badgeName: {
      fontSize: 11,
      fontWeight: '600',
      color: color.text,
      textAlign: 'center',
      lineHeight: 15,
    },

    // View all
    viewAllCard: {
      width: 100,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      backgroundColor: isLight ? color.primaryMuted : color.cardSurface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isLight ? `${color.primary}20` : color.foregroundSecondary,
      borderStyle: 'dashed',
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: color.primary,
      marginTop: Spacing.sm,
    },

    emptyStateText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xl,
    },
  });
};
