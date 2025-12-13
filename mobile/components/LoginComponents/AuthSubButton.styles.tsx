import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const authSubButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    button: {
      width: '100%',
      maxWidth: 400,
      padding: 20,
      backgroundColor: color.secondary,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      marginTop: Spacing.xl,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    title: {
      color: color.text,
      fontSize: 16,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
  });
};
