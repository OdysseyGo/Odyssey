import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      left: Spacing.md,
      right: Spacing.md,
      zIndex: 100,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      shadowColor: color.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    tourInfo: {
      flex: 1,
      marginRight: Spacing.md,
    },
    tourTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    progressText: {
      fontSize: 12,
      color: color.subText,
    },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.star,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.borderRadius,
      gap: Spacing.xs,
    },
    xpText: {
      fontSize: 12,
      fontWeight: '700',
      color: color.background,
    },
    endButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.error,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      gap: Spacing.xs,
    },
    endButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: color.white,
    },
    // Progress bar styles
    progressBarContainer: {
      marginTop: Spacing.sm,
    },
    progressBarBackground: {
      height: 4,
      backgroundColor: color.foregroundSecondary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: color.primary,
      borderRadius: 2,
    },
    // Mini step indicators
    stepIndicatorsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
      paddingHorizontal: 2,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: color.foregroundSecondary,
    },
    stepDotActive: {
      backgroundColor: color.primary,
      transform: [{ scale: 1.2 }],
    },
    stepDotCompleted: {
      backgroundColor: color.secondary,
    },
    stepDotCurrent: {
      backgroundColor: color.primary,
      borderWidth: 2,
      borderColor: color.star,
    },
  });
}
