import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
    },

    progressContainer: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    progressText: {
      fontSize: 12,
      color: color.subText,
      fontWeight: '500',
    },
    progressBarBackground: {
      height: 6,
      backgroundColor: color.foregroundSecondary,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: color.primary,
      borderRadius: 3,
    },
    progressDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
      paddingHorizontal: 2,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: color.foregroundSecondary,
    },
    progressDotCurrent: {
      backgroundColor: color.secondary,
      transform: [{ scale: 1.2 }],
    },
    progressDotCompleted: {
      backgroundColor: color.primary,
    },
    progressDotLocked: {
      backgroundColor: color.foregroundSecondary,
    },

    stepContentContainer: {
      flex: 1,
      paddingTop: Spacing.sm,
      minHeight: 0,
      maxHeight: '70%',
    },

    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: color.foregroundSecondary,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foregroundSecondary,
      gap: Spacing.xs,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    navButtonLocked: {
      backgroundColor: color.foregroundSecondary,
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
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
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foregroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationButtonConfirmed: {
      backgroundColor: color.primary,
    },
  });
}
