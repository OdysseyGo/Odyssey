import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourStoriesStepStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';
  return StyleSheet.create({
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    introCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
      gap: Spacing.md,
      shadowColor: isDark ? '#000' : color.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.25 : 0.07,
      shadowRadius: 16,
      elevation: 3,
    },
    introCopy: {
      flex: 1,
      minWidth: 0,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
    },
    progressBadge: {
      minWidth: 68,
      borderRadius: 8,
      backgroundColor: color.primaryMuted,
      borderWidth: 1,
      borderColor: color.borderLight,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    progressValue: {
      fontSize: 18,
      fontWeight: '800',
      color: color.primary,
    },
    progressLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: color.subText,
      textTransform: 'uppercase',
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.primaryMuted,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    warningText: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      fontWeight: '700',
      color: color.text,
      lineHeight: 19,
    },
    locationCard: {
      backgroundColor: color.cardSurface,
      borderColor: color.borderLight,
      borderRadius: 8,
      padding: Spacing.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    locationCardComplete: {
      borderColor: color.primary,
      backgroundColor: color.primaryMuted,
    },
    locationStatusRail: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 5,
      backgroundColor: color.borderLight,
    },
    locationStatusRailDone: {
      backgroundColor: color.primary,
    },
    locationCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      paddingRight: Spacing.md,
    },
    locationOrderBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: color.foregroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    locationOrderBadgeComplete: {
      backgroundColor: color.primary,
    },
    locationOrderText: {
      color: color.text,
      fontWeight: '800',
      fontSize: 14,
    },
    locationTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    locationCardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: color.text,
    },
    locationCardMeta: {
      fontSize: 11,
      color: color.subText,
      marginTop: 2,
      fontWeight: '600',
    },
    locationCardDescription: {
      fontSize: 13,
      color: color.subText,
      marginTop: Spacing.md,
      lineHeight: 19,
    },
    emptyState: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    emptyStateText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });
};
