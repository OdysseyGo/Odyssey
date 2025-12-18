import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileAddFriendsButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    button: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: Spacing.md,
      minHeight: 48,
      flexDirection: 'row',
      backgroundColor: color.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: Spacing.sm,
      color: 'white',
    },
    icon: {
      marginRight: Spacing.xs,
    },
    buttonPressed: {
      opacity: 0.6,
    },
  });
};
