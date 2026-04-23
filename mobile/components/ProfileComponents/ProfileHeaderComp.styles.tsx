import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileHeaderCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor: color.primary,
      paddingBottom: Spacing.xxl + Spacing.lg,
    },
    // Subtle lighter band at the bottom to fake a gradient feel
    bottomGlow: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '45%',
      backgroundColor: color.primary,
      opacity: isLight ? 0.55 : 0,
    },

    // Avatar
    avatarRing: {
      width: 112,
      height: 112,
      borderRadius: 56,
      borderWidth: isLight ? 3.5 : 3,
      borderColor: isLight ? 'rgba(255,255,255,0.9)' : color.white,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: 'rgba(0,0,0,0.35)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isLight ? 0.25 : 0.2,
          shadowRadius: 16,
        },
        android: { elevation: 10 },
      }),
    },
    avatarCircle: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: color.white,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    editBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isLight ? color.cardSurface : color.white,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: isLight ? color.headerGradientTop : color.primary,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: { elevation: 4 },
      }),
    },

    // Text
    username: {
      fontSize: 24,
      fontWeight: '800',
      color: color.white,
      marginTop: Spacing.md,
      letterSpacing: -0.3,
      ...Platform.select({
        ios: {
          textShadowColor: 'rgba(0,0,0,0.12)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
      }),
    },
    locationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: Spacing.borderRadiusFull,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    locationText: {
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.9)',
    },
  });
};
