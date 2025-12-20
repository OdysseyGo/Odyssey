import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourReviewStepStyles = (theme: ThemeName) => {
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
    summaryCard: {
      backgroundColor: color.textBackground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    summaryDescription: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    tag: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.primary,
    },
    tagText: {
      fontSize: 14,
      color: color.text,
      fontWeight: '500',
    },
    locationsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    locationCard: {
      backgroundColor: color.textBackground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    locationOrder: {
      fontSize: 16,
      fontWeight: '700',
      color: color.primary,
      marginRight: Spacing.sm,
    },
    locationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
      flex: 1,
    },
    locationStory: {
      fontSize: 13,
      color: color.subText,
      lineHeight: 18,
    },
    statsContainer: {
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
