import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const featuredTourCarouselStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      width: '100%',
      marginTop: Spacing.md,
    },
    carouselWrapper: {
      width: '100%',
      height: 400,
    },
    scrollView: {
      width: '100%',
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      width: SCREEN_WIDTH,
      paddingHorizontal: Spacing.md,
    },
    card: {
      width: '100%',
      height: '100%',
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
      backgroundColor: color.foreground,
    },
    imageWrapper: {
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60%',
      justifyContent: 'flex-end',
      padding: Spacing.lg,
    },
    featuredBadge: {
      position: 'absolute',
      top: Spacing.md,
      left: Spacing.md,
      backgroundColor: color.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.sm,
    },
    featuredBadgeText: {
      color: color.white,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    ratingBadge: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.backgroundBlack,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.sm,
    },
    star: {
      color: color.star,
    },
    ratingText: {
      color: color.white,
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 4,
    },
    infoContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      backgroundColor: color.backgroundBlack,
    },
    title: {
      color: color.primary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    author: {
      color: color.white,
      fontSize: 14,
      marginBottom: Spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    metaText: {
      color: color.white,
      fontSize: 13,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.md,
      gap: Spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: color.subText,
      opacity: 0.4,
    },
    dotActive: {
      width: 24,
      height: 8,
      borderRadius: 4,
      backgroundColor: color.primary,
      opacity: 1,
    },
  });
};
