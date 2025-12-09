import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const authSubButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    button: {
      backgroundColor: 'transparent',
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    title: {
      color: color.secondary,
      fontSize: 16,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
  });
};
