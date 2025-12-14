import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formTextInputStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    textInput: {
      backgroundColor: color.foreground,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: 16,
      color: color.text,
    },
  });
};
