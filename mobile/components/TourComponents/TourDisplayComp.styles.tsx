import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDisplayCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      marginHorizontal: Spacing.sm,
      width: 200,
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: Spacing.lg,
    },
    imageWrapper: {
      position: 'relative',
      overflow: 'hidden',
    },

    image: {
      width: '100%',
      height: 140,
    },

    ratingBadge: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: color.backgroundBlack,
      borderRadius: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },

    star: {
      color: '#FFD700',
    },
    ratingBadgeText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 12,
    },

    header: {
      width: '100%',
    },

    infoContainer: {
      padding: Spacing.md,
    },
    title: {
      color: color.primary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.xs,
      lineHeight: 20,
    },
    author: {
      fontSize: 13,
      color: color.subText,
      marginBottom: Spacing.sm,
    },
    rating: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.sm,
      fontStyle: 'italic',
    },
    metaRow: {
      marginTop: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    metaText: {
      fontSize: 12,
      color: color.subText,
    },
  });
};
