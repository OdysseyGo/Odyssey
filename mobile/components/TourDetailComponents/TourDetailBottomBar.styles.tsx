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
      borderTopColor: color.foreground,
    },
    startButton: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.lg,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
    },
    startButtonPressed: {
      opacity: 0.8,
    },
    startButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
};
