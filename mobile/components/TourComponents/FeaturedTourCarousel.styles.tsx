import { StyleSheet, Dimensions, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_H_PADDING = Spacing.lg;
const CARD_WIDTH = SCREEN_WIDTH - CARD_H_PADDING * 2;

export { CARD_WIDTH, CARD_H_PADDING };

export const featuredTourCarouselStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      width: '100%',
      marginTop: Spacing.md,
    },
    carouselWrapper: {
      width: '100%',
      height: 310,
    },
    scrollView: {
      width: '100%',
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      width: SCREEN_WIDTH,
      paddingHorizontal: CARD_H_PADDING,
    },
    card: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: color.foreground,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000' : color.primary,
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: isDark ? 0.5 : 0.2,
          shadowRadius: 28,
        },
        android: { elevation: 14 },
      }),
    },
    cardPressed: {
      transform: [{ scale: 0.98 }],
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
    imagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: color.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Subtle vignette on the whole image
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.15)',
    },

    // Featured badge — compact & vibrant
    featuredBadge: {
      position: 'absolute',
      top: Spacing.md + 2,
      left: Spacing.md + 2,
      backgroundColor: color.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    },
    featuredBadgeText: {
      color: color.white,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    // Rating — glassmorphic
    ratingBadge: {
      position: 'absolute',
      top: Spacing.md + 2,
      right: Spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.12)',
      gap: 4,
    },
    star: {
      color: color.star,
      fontSize: 13,
    },
    ratingText: {
      color: color.white,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    // Bottom info — layered gradient look
    infoContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 60,
    },
    infoGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    infoContent: {
      zIndex: 1,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg + 2,
    },
    title: {
      color: color.white,
      fontSize: 23,
      fontWeight: '800',
      marginBottom: 6,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0,0,0,0.4)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: Spacing.sm + 2,
    },
    author: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      fontWeight: '500',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.14)',
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: 10,
      gap: 4,
    },
    metaText: {
      color: color.white,
      fontSize: 11,
      fontWeight: '600',
    },

    // Pagination — refined dots
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.md,
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: color.foregroundSecondary,
    },
    dotActive: {
      width: 26,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: color.primary,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
      }),
    },
  });
};
