import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
    },

    tierPopup: {
      position: 'absolute',
      top: 8,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.xl,
      backgroundColor: color.cardSurface,
      borderWidth: 1,
      borderColor: color.borderLight,
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 6,
    },
    tierPopupBadgeCol: {
      alignItems: 'center',
      gap: Spacing.xs,
    },
    crossOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierPopupLabel: {
      fontSize: 13,
      fontWeight: '800',
    },
    locationToast: {
      position: 'absolute',
      bottom: 96,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.lg,
      backgroundColor: color.cardSurface,
      borderWidth: 1,
      borderColor: color.easy,
      zIndex: 11,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
    locationToastText: {
      fontSize: 13,
      fontWeight: '700',
      color: color.text,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
      gap: Spacing.sm,
      backgroundColor: color.cardSurface,
    },

    actionGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    badgeStatusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.md,
      borderWidth: 1.5,
      borderColor: color.borderLight,
      gap: Spacing.xs,
    },
    badgeStatusTextGroup: {
      flexDirection: 'column',
      gap: 1,
    },
    badgeStatusEyebrow: {
      fontSize: 8,
      fontWeight: '700',
      color: color.subText,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    badgeStatusText: {
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 14,
    },
    actionButton: {
      flex: 1,
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.md,
      backgroundColor: color.cardSurface,
      borderWidth: 1,
      borderColor: color.borderLight,
      gap: Spacing.xs,
    },
    actionButtonPressed: {
      backgroundColor: color.primaryMuted,
    },
    actionLabel: {
      color: color.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    closeTourButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Spacing.md,
      backgroundColor: color.cardSurface,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(220, 38, 38, 0.26)' : 'rgba(220, 38, 38, 0.16)',
    },
    closeTourButtonPressed: {
      backgroundColor: theme === 'dark' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(220, 38, 38, 0.07)',
    },

    stepContentContainer: {
      flex: 1,
      paddingTop: 0,
      minHeight: 0,
      maxHeight: '72%',
    },

    navigationContainer: {
      marginTop: 'auto',
      flexShrink: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
      marginBottom: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: color.borderLight,
      backgroundColor: color.cardSurface,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 108,
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: Spacing.md,
      borderWidth: 1,
      borderColor: color.borderLight,
      gap: Spacing.xs,
    },
    navButtonSecondary: {
      backgroundColor: 'transparent',
    },
    navButtonPrimary: {
      borderColor: color.primary,
      backgroundColor: color.primary,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    navButtonLocked: {
      backgroundColor: color.foregroundSecondary,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: color.text,
    },
    navButtonPrimaryText: {
      color: color.background,
    },
    navButtonTextDisabled: {
      color: color.subText,
    },
    lockedIcon: {
      marginLeft: Spacing.xs,
    },
    stepIndicator: {
      alignItems: 'center',
    },
    stepIndicatorText: {
      fontSize: 16,
      fontWeight: '700',
      color: color.text,
    },
    stepIndicatorSubtext: {
      fontSize: 11,
      color: color.subText,
    },

    locationButtonCompact: {
      width: 42,
      height: 42,
      borderRadius: Spacing.md,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    locationButtonConfirmed: {
      backgroundColor: color.primary,
    },

    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: color.overlay,
    },
    modalDismissArea: {
      flex: 1,
    },
    modalCard: {
      backgroundColor: color.background,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
      borderTopLeftRadius: Spacing.xl,
      borderTopRightRadius: Spacing.xl,
      gap: Spacing.sm,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
    },
    modalSubtitle: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.sm,
    },
    providerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    providerIcon: {
      marginRight: Spacing.sm,
    },
    providerButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
    },
    modalCancelButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      marginTop: Spacing.sm,
    },
    modalCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.primary,
    },
  });
}
