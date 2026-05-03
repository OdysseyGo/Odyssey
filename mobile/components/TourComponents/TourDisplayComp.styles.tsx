import { StyleSheet, Platform, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.md) / 2;
const CARD_HEIGHT = 255;

export { CARD_WIDTH, CARD_HEIGHT };

export const tourDisplayCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
    cardWrapper: {
      width: CARD_WIDTH,
    },

    card: {
      width: '100%',
      height: CARD_HEIGHT,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: color.foreground,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000' : color.text,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 24,
        },
        android: {
          elevation: 12,
        },
      }),
    },

    image: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: color.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },

    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '65%',
    },

    // Rating badge — glassmorphic
    ratingBadge: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    ratingText: {
      color: color.white,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    // Duration pill
    durationPill: {
      position: 'absolute',
      top: Spacing.md,
      left: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: color.primary,
      borderRadius: 10,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.45,
          shadowRadius: 6,
        },
        android: { elevation: 4 },
      }),
    },
    durationText: {
      color: color.white,
      fontSize: 11,
      fontWeight: '700',
    },

    // Info overlay at bottom
    infoOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.md + 2,
      paddingTop: Spacing.lg,
    },

    title: {
      color: color.white,
      fontSize: 15,
      fontWeight: '700',
      lineHeight: 20,
      letterSpacing: -0.2,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 4,
    },
    metaText: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 11,
      fontWeight: '500',
      flexShrink: 1,
    },
    stepsChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginLeft: 'auto',
      paddingHorizontal: 7,
      paddingVertical: 3,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 8,
    },
    stepsText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 10,
      fontWeight: '700',
    },
  });
};
