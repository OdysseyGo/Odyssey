import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const createTourButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    floatingButton: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    glowRing: {
      position: 'absolute',
      width: Spacing.xl,
      height: Spacing.xl,
      borderRadius: Spacing.xl / 2,
      borderWidth: 2,
      borderColor: `${color.primary}30`,
    },
  });
};
