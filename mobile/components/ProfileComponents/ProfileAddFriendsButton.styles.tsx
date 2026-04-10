import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileAddFriendsButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    button: {
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.lg,
      borderRadius: Spacing.borderRadiusFull,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 1.5,
      borderColor: isLight ? color.primary : color.primary,
      backgroundColor: isLight ? color.primaryMuted : 'transparent',
      alignSelf: 'center',
      gap: Spacing.sm,
      ...Platform.select({
        ios: isLight
          ? {
              shadowColor: color.primary,
              shadowOpacity: 0.1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }
          : {},
        android: {},
      }),
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: color.primary,
    },
    buttonPressed: {
      opacity: 0.6,
    },
  });
};
