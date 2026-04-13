import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';

export const tourDetailCoverStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    coverContainer: {
      height: 460,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: 'hidden',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 280,
    },
    titleOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingBottom: 26,
      gap: 6,
    },
    overlayTitle: {
      color: color.white,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      textShadowColor: color.textShadowColor,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    overlayStar: {
      color: color.star,
      fontSize: 14,
    },
    overlayRating: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
    },
    overlayReviews: {
      color: color.white,
      fontSize: 13,
      opacity: 0.72,
    },
    backButton: {
      position: 'absolute',
      left: 16,
      backgroundColor: color.backgroundBlack,
    },
  });
};
