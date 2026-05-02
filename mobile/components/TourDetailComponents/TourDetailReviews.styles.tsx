import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailReviewsStyles = (theme: ThemeName) => {
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
    reviewCountBadge: {
      backgroundColor: color.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 12,
    },
    reviewCount: {
      color: color.white,
      fontSize: 12,
      fontWeight: '600',
    },
    reviewList: {
      gap: Spacing.md,
    },
    reviewCard: {
      backgroundColor: color.foreground,
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    reviewerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    reviewerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    reviewerDetails: {
      flex: 1,
    },
    reviewerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    reviewerName: {
      color: color.text,
      fontSize: 14,
      fontWeight: '600',
    },
    reviewerUsername: {
      color: color.subText,
      fontSize: 14,
      fontWeight: '500',
    },
    reviewDate: {
      color: color.subText,
      fontSize: 12,
      marginTop: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    reportReviewButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingText: {
      color: color.text,
      fontSize: 13,
      fontWeight: '600',
    },
    reviewComment: {
      color: color.text,
      fontSize: 14,
      lineHeight: 20,
      marginTop: Spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
    },
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    emptyText: {
      color: color.subText,
      fontSize: 14,
      fontWeight: '500',
    },
    loadingContainer: {
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    skeletonCard: {
      backgroundColor: color.foreground,
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
  });
};
