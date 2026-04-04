import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const featuredTourCarouselStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      width: '100%',
      marginTop: 0,
    },
    carouselWrapper: {
      width: '100%',
      height: 420,
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
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: color.foreground,
      // Shadow
      shadowColor: color.text,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.5 : 0.2,
      shadowRadius: 20,
      elevation: 12,
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
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    // Featured badge - premium look
    featuredBadge: {
      position: 'absolute',
      top: Spacing.lg,
      left: Spacing.lg,
      backgroundColor: color.primary,
      paddingHorizontal: Spacing.md + 4,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      // Glow effect
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 6,
    },
    featuredIcon: {
      color: color.white,
    },
    featuredBadgeText: {
      color: color.white,
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Rating - glassmorphism style
    ratingBadge: {
      position: 'absolute',
      top: Spacing.lg,
      right: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      gap: 4,
    },
    star: {
      color: color.star,
      fontSize: 14,
    },
    ratingText: {
      color: color.white,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    // Info container - gradient overlay look
    infoContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 80,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
      backgroundColor: 'transparent',
    },
    infoGradient: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    infoContent: {
      zIndex: 1,
    },
    title: {
      color: color.white,
      fontSize: 26,
      fontWeight: '800',
      marginBottom: Spacing.sm,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: Spacing.md,
    },
    authorIcon: {
      opacity: 0.8,
    },
    author: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      fontWeight: '500',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs + 2,
      borderRadius: 12,
      gap: 5,
    },
    metaIcon: {
      color: color.white,
    },
    metaText: {
      color: color.white,
      fontSize: 12,
      fontWeight: '600',
    },
    // Pagination - modern pill style
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: color.subText,
      opacity: 0.3,
    },
    dotActive: {
      width: 32,
      height: 8,
      borderRadius: 4,
      backgroundColor: color.primary,
      // Glow
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 3,
    },
  });
};
