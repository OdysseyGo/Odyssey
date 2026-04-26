import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourStoriesStepStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.lg,
    },
    locationCard: {
      backgroundColor: color.foregroundSecondary,
      borderColor: color.borderLight,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 2,
    },
    locationCardComplete: {
      borderColor: color.primary,
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
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    locationOrderText: {
      color: color.text,
      fontWeight: '600',
      fontSize: 14,
    },
    locationCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
      flex: 1,
      flexShrink: 1,
    },
    locationCardDescription: {
      fontSize: 12,
      color: color.subText,
      marginTop: Spacing.xs,
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
