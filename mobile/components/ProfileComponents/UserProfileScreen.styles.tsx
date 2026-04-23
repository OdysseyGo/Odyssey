import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const userProfileStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: color.background,
    },

    // ── Sticky bar ────────────────────────────────────────────────────
    stickyBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 10,
    },
    stickyBarText: {
      fontSize: 17,
      fontWeight: '700',
      color: color.white,
      letterSpacing: -0.3,
    },

    // ── Back button (always visible overlay) ──────────────────────────
    backButtonOverlay: {
      position: 'absolute',
      left: Spacing.md,
      zIndex: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Follow button ─────────────────────────────────────────────────
    followButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs + 2,
      marginTop: Spacing.lg,
      marginHorizontal: Spacing.xl,
      paddingVertical: Spacing.md + 2,
      borderRadius: Spacing.borderRadiusFull,
    },
    followButtonFollow: {
      backgroundColor: color.primary,
    },
    followButtonUnfollow: {
      backgroundColor: color.foreground,
      borderWidth: 1.5,
      borderColor: color.borderLight,
    },
    followButtonText: {
      fontSize: 15,
      fontWeight: '700',
    },

    // ── Section ───────────────────────────────────────────────────────
    section: {
      marginTop: Spacing.xl,
      marginHorizontal: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
      marginBottom: Spacing.md,
    },
    accentBar: {
      width: 3.5,
      height: 20,
      borderRadius: 2,
      backgroundColor: color.secondary,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: color.text,
      letterSpacing: -0.3,
    },
    sectionLoader: {
      paddingVertical: Spacing.xl,
    },
    emptyText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },
    toursList: {
      gap: Spacing.sm,
    },

    // ── Error state ───────────────────────────────────────────────────
    errorRoot: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorCard: {
      alignItems: 'center',
      padding: Spacing.xxl,
      borderRadius: 26,
      gap: Spacing.md,
      maxWidth: 320,
      width: '100%',
      backgroundColor: isLight ? color.cardSurface : color.foreground,
    },
    errorIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
      textAlign: 'center',
      color: color.text,
    },
    errorSubtitle: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
      color: color.subText,
    },
  });
};
