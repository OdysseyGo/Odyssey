import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formInputGroupStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    inputGroup: {
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
  });
};
