import { Platform, StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailStopsStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      color: color.text,
      fontSize: 18,
      fontWeight: '700',
    },
    stopCountBadge: {
      backgroundColor: color.primaryMuted,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: Spacing.borderRadiusFull,
    },
    stopCount: {
      color: color.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    stopItem: {
      flexDirection: 'row',
      minHeight: 80,
    },
    // Timeline column
    timelineColumn: {
      width: 40,
      alignItems: 'center',
    },
    stopNumber: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
        },
        android: { elevation: 4 },
      }),
    },
    stopNumberFirst: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 3,
      borderColor: color.primary + '35',
    },
    stopNumberLocked: {
      backgroundColor: color.iconDisabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    stopNumberText: {
      color: color.white,
      fontSize: 13,
      fontWeight: '800',
    },
    connectorLine: {
      flex: 1,
      width: 2,
      backgroundColor: color.primary + '20',
    },
    connectorLineLocked: {
      backgroundColor: color.iconDisabled + '55',
    },
    connectorLineDashed: {
      flex: 1,
      width: 2,
      backgroundColor: color.primary + '12',
    },
    // Content column
    stopContent: {
      flex: 1,
      marginLeft: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    stopContentLast: {
      paddingBottom: Spacing.sm,
    },
    stopCard: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md + 2,
      borderLeftWidth: 3,
      borderLeftColor: color.primary + '40',
    },
    stopCardLocked: {
      overflow: 'hidden',
      borderLeftColor: color.iconDisabled + '55',
      opacity: 0.78,
      minHeight: 96,
    },
    stopTitle: {
      color: color.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    stopTitleLocked: {
      color: color.subText,
    },
    stopDescription: {
      color: color.subText,
      fontSize: 13,
      lineHeight: 20,
    },
    stopDescriptionLocked: {
      color: color.iconDisabled,
    },
    stopBlur: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: color.overlayLight,
    },
    lockedOverlay: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md + 2,
      gap: Spacing.md,
      backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.62)' : 'rgba(248, 250, 252, 0.68)',
    },
    lockedIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primaryMuted,
      borderWidth: 1,
      borderColor: color.primary + '25',
    },
    lockedCopy: {
      flex: 1,
    },
    lockedTitle: {
      color: color.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: Spacing.xs,
    },
    lockedMessage: {
      color: color.subText,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },
  });
};
