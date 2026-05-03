import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailScreenStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    // ─── Error card
    errorCard: {
      alignItems: 'center',
      padding: Spacing.xxl,
      borderRadius: 26,
      gap: Spacing.md,
      maxWidth: 300,
      width: '100%',
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
      fontSize: 19,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    errorText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadiusFull,
      marginTop: Spacing.xs,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '700',
    },
    bottomSpacer: {
      height: 120,
    },
    // ─── Scroll-aware overlay header
    overlayHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    overlayHeaderBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: color.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: color.foregroundSecondary,
    },
    overlayHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: 10,
      paddingTop: 8,
    },
    overlayTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
      paddingHorizontal: Spacing.sm,
      color: color.text,
    },
    overlaySpacer: {
      width: 38,
      height: 38,
    },
    overlayAbsoluteFill: {
      ...StyleSheet.absoluteFillObject,
    },
    headerIconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
