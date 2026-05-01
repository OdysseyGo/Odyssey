import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileHeaderCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    outerWrapper: {
      width: '100%',
      position: 'relative',
    },
    container: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: Spacing.xxl + Spacing.lg + 12,
      overflow: 'hidden',
    },

    // Soft top-down highlight overlay (fakes a radial spotlight from the top)
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60%',
    },

    // Scalloped bottom edge — outer wraps a rounded inset rectangle that
    // peeks from the bottom, giving a soft curved separation from the page.
    bottomCurve: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      right: 0,
      height: 28,
      overflow: 'hidden',
    },
    bottomCurveInner: {
      position: 'absolute',
      bottom: 0,
      left: -20,
      right: -20,
      height: 50,
      borderTopLeftRadius: 200,
      borderTopRightRadius: 200,
    },

    settingsButton: {
      position: 'absolute',
      width: Spacing.iconButtonSmall,
      height: Spacing.iconButtonSmall,
      borderRadius: Spacing.borderRadiusFull,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.profileHeaderButtonBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.profileHeaderButtonBorder,
      zIndex: 5,
      ...Platform.select({
        ios: {
          shadowColor: color.profileHeaderShadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    },

    // Text
    username: {
      fontSize: 24,
      fontWeight: '800',
      color: color.white,
      marginTop: Spacing.lg,
      letterSpacing: -0.3,
      ...Platform.select({
        ios: {
          textShadowColor: color.profileHeaderTextShadow,
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
      }),
    },
    tierTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 3,
      marginTop: 2,
      ...Platform.select({
        ios: {
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        },
      }),
    },
    xpFractionText: {
      fontSize: 13,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.95)',
      marginTop: 6,
      letterSpacing: 0.3,
      ...Platform.select({
        ios: {
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
      }),
    },
    xpToNextText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
      letterSpacing: 0.4,
    },
    locationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
      backgroundColor: color.profileHeaderLocationChipBackground,
      borderRadius: Spacing.borderRadiusFull,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.profileHeaderLocationChipBorder,
    },
    locationText: {
      fontSize: 13,
      fontWeight: '500',
      color: color.profileHeaderLocationText,
    },
  });
};
