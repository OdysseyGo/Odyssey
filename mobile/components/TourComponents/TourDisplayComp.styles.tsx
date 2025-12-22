import { StyleSheet, Platform, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2.5) / 2;
const CARD_HEIGHT = 280;

export const tourDisplayCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
   cardWrapper: {
      width: CARD_WIDTH,
      marginBottom: Spacing.md,
    },

    card: {
      width: '100%',
      height: CARD_HEIGHT,
      backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF',
      borderRadius: 28,
      overflow: 'hidden',
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000000' : color.primary,
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: isDark ? 0.6 : 0.15,
          shadowRadius: 32,
        },
        android: {
          elevation: 16,
        },
      }),
    },

   imageContainer: {
      position: 'relative',
      width: '100%',
      height: 160,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    
    imageGradientTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    imageGradientBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
bookmarkButton: {
      position: 'absolute',
      top: 12,
      left: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    bookmarkButtonActive: {
      backgroundColor: 'rgba(255,107,107,0.25)',
      borderColor: '#FF6B6B',
      ...Platform.select({
        ios: {
          shadowColor: '#FF6B6B',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 10,
        },
      }),
    },

    ratingBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,215,61,0.3)',
    },
    ratingText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    durationChip: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: color.primary,
      borderRadius: 20,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    durationText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    distanceChip: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    distanceText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },

    contentContainer: {
      flex: 1,
      padding: 14,
      paddingTop: 14,
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#252528' : '#F5F5F7',
    },

    titleContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    title: {
      flex: 1,
      color: isDark ? '#FFFFFF' : '#0A0A0A',
      fontSize: 17,
      fontWeight: '500',
      lineHeight: 22,
      letterSpacing: -0.2,
    },

    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    

    authorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    authorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: color.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: color.secondary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
        },
      }),
    },
    authorText: {
      flex: 1,
      color: isDark ? '#B0B0B5' : '#4A4A4A',
      fontSize: 12,
      fontWeight: '600',
    },


    reviewsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: isDark ? 'rgba(255,107,107,0.12)' : 'rgba(255,107,107,0.08)',
      borderRadius: 12,
    },
    reviewsText: {
      color: color.primary,
      fontSize: 12,
      fontWeight: '700',
    },
  });
};
