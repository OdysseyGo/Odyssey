import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailCoverStyles = (theme: ThemeName, headerHeight: number = 0) => {
  const color = Colors[theme];

  return StyleSheet.create({
    coverContainer: {
      marginTop: headerHeight,
      height: 280,
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    coverContent: {
      position: 'absolute',
      bottom: Spacing.xl,
      left: Spacing.lg,
      right: Spacing.lg,
    },
    coverTitle: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '700',
      marginBottom: Spacing.sm,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    star: {
      color: '#FFD700',
      fontSize: 16,
    },
    ratingText: {
      color: '#fff',
      fontSize: 14,
    },
  });
};
