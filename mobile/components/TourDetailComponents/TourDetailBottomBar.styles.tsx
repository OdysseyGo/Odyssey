import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailBottomBarStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.lg,
      paddingBottom: Spacing.xl + Spacing.lg,
      backgroundColor: color.background,
      borderTopWidth: 1,
      borderTopColor: color.foregroundSecondary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 10,
    },
    startButton: {
      flexDirection: 'row',
      backgroundColor: color.primary,
      paddingVertical: Spacing.lg,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    startButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
};
