import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileBadgesContainerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';
  const modalLight = Colors.light;

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
      width: 118,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
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
      borderWidth: 1,
      borderColor: isLight ? color.primary : color.primary,
      backgroundColor: isLight ? `${color.primary}06` : color.cardSurface,
    },
    badgeName: {
      fontSize: 11,
      fontWeight: '600',
      color: color.text,
      textAlign: 'center',
      lineHeight: 15,
      marginTop: 6,
    },
    badgeMetaText: {
      marginTop: 2,
      fontSize: 9,
      fontWeight: '500',
      color: color.subText,
      textAlign: 'center',
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

    detailsOverlay: {
      flex: 1,
      backgroundColor: color.backgroundBlack,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    detailsCard: {
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      borderRadius: 24,
      borderWidth: 1.5,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xxl,
      paddingBottom: Spacing.xl,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
      elevation: 12,
    },
    detailsGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    detailsTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255,255,255,0.72)',
    },
    detailsCloseButton: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.55)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: modalLight.borderLight,
      zIndex: 2,
    },
    detailsBadgeShell: {
      width: 166,
      height: 170,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.55)',
      marginBottom: Spacing.lg,
    },
    detailsTier: {
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.xs,
    },
    detailsName: {
      fontSize: 22,
      fontWeight: '800',
      color: modalLight.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    detailsDescription: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: modalLight.subText,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    detailsInfoGrid: {
      width: '100%',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    detailsInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: 'rgba(255,255,255,0.45)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: modalLight.borderLight,
    },
    detailsInfoLinkItem: {
      borderColor: modalLight.primary,
      backgroundColor: 'rgba(255,255,255,0.62)',
    },
    detailsInfoText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: modalLight.text,
    },
    detailsInfoLinkText: {
      color: modalLight.primary,
    },
  });
};
